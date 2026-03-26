#!/usr/bin/env python3

import json
import os
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


PORT = int(os.getenv("PORT", "8787"))
APP_ID = os.getenv("APPSFLYER_APP_ID", "com.example.travelmate")
S2S_KEY = os.getenv("APPSFLYER_S2S_KEY", "")
BUNDLE_IDENTIFIER = os.getenv("APPSFLYER_BUNDLE_ID", APP_ID)
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "*")
CUID_MAP_PATH = Path(os.getenv("CUID_MAP_PATH", "./cuid-map.json"))


class RelayHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self._set_cors_headers()
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/appsflyer-s2s":
            self._send_json(404, {"error": "Not found"})
            return

        if not S2S_KEY:
            self._send_json(
                500,
                {
                    "error": "Missing APPSFLYER_S2S_KEY. Generate the S2S key in AppsFlyer and set it in the relay environment."
                },
            )
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(content_length).decode("utf-8")
            payload = json.loads(body)
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"error": "Invalid JSON body."})
            return

        appsflyer_id = resolve_appsflyer_id(payload)
        if not appsflyer_id:
            self._send_json(
                400,
                {
                    "error": "Missing appsflyer_id. AppsFlyer requires appsflyer_id for mobile S2S attribution. Pass appsflyer_id from the app or map customer_user_id to appsflyer_id in the relay."
                },
            )
            return

        upstream_payload = {
            "appsflyer_id": appsflyer_id,
            "customer_user_id": payload.get("customerUserId") or None,
            "eventName": sanitize_event_name(payload.get("eventName", "website_event")),
            "eventValue": json.dumps(payload.get("eventValue", {})),
            "eventCurrency": payload.get("eventCurrency", "INR"),
            "eventTime": format_utc(payload.get("eventTime")),
            "bundleIdentifier": BUNDLE_IDENTIFIER,
            "ip": self.client_address[0],
            "custom_data": json.dumps(
                {
                    "website_event": True,
                    "page": payload.get("page", ""),
                    "path": payload.get("path", ""),
                    "referrer": payload.get("referrer", ""),
                    "user_agent": self.headers.get("User-Agent", ""),
                    "source": "mwebsite",
                }
            ),
        }

        request = Request(
            f"https://api3.appsflyer.com/inappevent/{APP_ID}",
            data=json.dumps(upstream_payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": S2S_KEY,
            },
            method="POST",
        )

        try:
            with urlopen(request, timeout=15) as response:
                response_body = response.read().decode("utf-8")
                self._send_json(
                    200,
                    {
                        "ok": True,
                        "status": response.status,
                        "appsflyerResponse": response_body,
                    },
                )
        except HTTPError as error:
            response_body = error.read().decode("utf-8")
            self._send_json(
                error.code,
                {
                    "ok": False,
                    "status": error.code,
                    "appsflyerResponse": response_body,
                },
            )
        except URLError as error:
            self._send_json(
                502,
                {
                    "ok": False,
                    "error": f"Unable to reach AppsFlyer: {error.reason}",
                },
            )

    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Content-Type", "application/json")

    def _send_json(self, status, body):
        self.send_response(status)
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(body).encode("utf-8"))

    def log_message(self, format, *args):
        return


def resolve_appsflyer_id(payload):
    if payload.get("appsflyerId"):
        return payload["appsflyerId"]

    customer_user_id = payload.get("customerUserId")
    if not customer_user_id or not CUID_MAP_PATH.exists():
        return ""

    try:
        with CUID_MAP_PATH.open("r", encoding="utf-8") as file:
            mapping = json.load(file)
        return mapping.get(customer_user_id, "")
    except (OSError, json.JSONDecodeError):
        return ""


def sanitize_event_name(name):
    return str(name).strip()[:45] or "website_event"


def format_utc(value):
    if value:
      dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    else:
      dt = datetime.now(timezone.utc)
    dt = dt.astimezone(timezone.utc)
    return dt.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]


def main():
    server = HTTPServer(("0.0.0.0", PORT), RelayHandler)
    print(f"AppsFlyer S2S relay listening on http://localhost:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
