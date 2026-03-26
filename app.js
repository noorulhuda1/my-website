const products = [
  {
    id: "apple",
    name: "Organic Apple",
    category: "fruits",
    price: "INR 260",
    emoji: "🍎",
    unit: "1 kg pack",
    stock: "In stock",
    description: "Crisp, sweet apples picked for everyday snacking, juices, and lunch boxes."
  },
  {
    id: "banana",
    name: "Banana Bunch",
    category: "fruits",
    price: "INR 190",
    emoji: "🍌",
    unit: "6 bananas",
    stock: "In stock",
    description: "Soft ripe bananas with natural sweetness, ideal for breakfast or smoothies."
  },
  {
    id: "orange",
    name: "Fresh Orange",
    category: "fruits",
    price: "INR 330",
    emoji: "🍊",
    unit: "1 kg pack",
    stock: "Low stock",
    description: "Juicy oranges with bright citrus flavor and a refreshing finish."
  },
  {
    id: "tomato",
    name: "Red Tomato",
    category: "vegetables",
    price: "INR 230",
    emoji: "🍅",
    unit: "1 kg pack",
    stock: "In stock",
    description: "Kitchen-ready tomatoes for salads, curries, sauces, and sandwiches."
  },
  {
    id: "carrot",
    name: "Crunchy Carrot",
    category: "vegetables",
    price: "INR 180",
    emoji: "🥕",
    unit: "500 g pack",
    stock: "In stock",
    description: "Fresh carrots with a clean crunch for soups, stir-fries, and snacks."
  },
  {
    id: "spinach",
    name: "Baby Spinach",
    category: "vegetables",
    price: "INR 140",
    emoji: "🥬",
    unit: "250 g pack",
    stock: "In stock",
    description: "Tender spinach leaves for salads, sauteed dishes, and green smoothies."
  },
  {
    id: "water",
    name: "Mineral Water",
    category: "water",
    price: "INR 40",
    emoji: "💧",
    unit: "1 litre bottle",
    stock: "In stock",
    description: "Clean mineral water for hydration at home, work, or on the move."
  },
  {
    id: "sparkling-water",
    name: "Sparkling Water",
    category: "water",
    price: "INR 70",
    emoji: "🫧",
    unit: "750 ml bottle",
    stock: "In stock",
    description: "Crisp sparkling water with a light fizz and refreshing finish."
  },
  {
    id: "milk",
    name: "Farm Fresh Milk",
    category: "dairy",
    price: "INR 85",
    emoji: "🥛",
    unit: "1 litre carton",
    stock: "In stock",
    description: "Smooth everyday milk for tea, coffee, cereal, and cooking."
  }
];

const page = document.body.dataset.page;
const defaultOneLinkUrl = "https://noorulh.onelink.me/d28T";

if (page === "home") {
  setupHomePage();
}

if (page === "detail") {
  setupDetailPage();
}

initializeAppsFlyerLinks();

function setupHomePage() {
  const form = document.querySelector("#search-form");
  const input = document.querySelector("#search-input");
  const results = document.querySelector("#results");
  const summary = document.querySelector("#results-summary");
  const chips = document.querySelectorAll(".chip");

  let activeQuery = "";

  renderResults(products);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    activeQuery = input.value.trim().toLowerCase();
    const filtered = filterProducts(activeQuery);
    renderResults(filtered);
  });

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const filter = chip.dataset.filter;
      input.value = filter;
      activeQuery = filter;
      renderResults(filterProducts(activeQuery));
    });
  });

  function renderResults(items) {
    if (!items.length) {
      summary.textContent = `No products found for "${activeQuery}"`;
      results.innerHTML = `
        <article class="empty-state">
          <h4>No matching products</h4>
          <p>Try searching for fruits, vegetables, water, milk, or another grocery item.</p>
        </article>
      `;
      return;
    }

    summary.textContent = activeQuery
      ? `Showing ${items.length} result${items.length > 1 ? "s" : ""} for "${activeQuery}"`
      : "Showing all products";

    results.innerHTML = items.map(renderProductCard).join("");
  }
}

function setupDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  const container = document.querySelector("#product-detail");
  const product = products.find((item) => item.id === productId);

  if (!product) {
    container.innerHTML = `
      <section class="empty-state">
        <h2>Product not found</h2>
        <p>Select a product from the search page to open its details here.</p>
        <a class="back-link" href="index.html">Return to home page</a>
      </section>
    `;
    return;
  }

  document.title = `${product.name} | Fresh Basket`;
  container.innerHTML = `
    <section class="detail-grid">
      <div class="detail-visual">
        <div class="detail-emoji" aria-hidden="true">${product.emoji}</div>
      </div>
      <div class="detail-info">
        <div class="detail-top">
          <div>
            <p class="product-meta">${capitalize(product.category)}</p>
            <h2>${product.name}</h2>
          </div>
          <div class="detail-price">${product.price}</div>
        </div>
        <p class="detail-copy">${product.description}</p>
        <div class="detail-facts">
          <span class="fact-pill">${product.unit}</span>
          <span class="fact-pill">${product.stock}</span>
        </div>
        <a class="detail-cta" href="index.html">Continue shopping</a>
      </div>
    </section>
  `;
}

function filterProducts(query) {
  if (!query) {
    return products;
  }

  return products.filter((product) => {
    const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase();
    return haystack.includes(query);
  });
}

function renderProductCard(product) {
  return `
    <article class="product-card">
      <div class="product-title-row">
        <span class="product-emoji" aria-hidden="true">${product.emoji}</span>
        <span class="price-badge">${product.price}</span>
      </div>
      <div>
        <p class="product-meta">${capitalize(product.category)}</p>
        <h4>${product.name}</h4>
      </div>
      <p>${product.description}</p>
      <div class="product-footer">
        <span>${product.unit}</span>
        <a class="view-link" href="product.html?id=${product.id}">View details</a>
      </div>
    </article>
  `;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function initializeAppsFlyerLinks() {
  const appLinks = document.querySelectorAll(".app-link");
  const fallbackUrl = appendCurrentProduct(defaultOneLinkUrl);

  appLinks.forEach((link) => {
    link.href = fallbackUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });

  if (!window.AF_SMART_SCRIPT || typeof window.AF_SMART_SCRIPT.generateOneLinkURL !== "function") {
    return;
  }

  const mediaSource = { keys: ["utm_source"], defaultValue: "default" };
  const campaignCode = { paramKey: "campaign_code", keys: ["campaign_code"], defaultValue: "default" };
  const afAdsetId = { paramKey: "af_adsetid", keys: ["utm_adsetid"] };
  const forceDeepLink = { paramKey: "af_force_deeplink", defaultValue: "true" };
  const customSsUi = { paramKey: "af_ss_ui", defaultValue: "true" };
  const productDeepLink = {
    paramKey: "deep_link_value",
    defaultValue: page === "detail" ? "product-detail" : "home"
  };
  const selectedProduct = getSelectedProductId();
  const productParam = selectedProduct
    ? { paramKey: "af_sub1", defaultValue: selectedProduct }
    : null;

  const result = window.AF_SMART_SCRIPT.generateOneLinkURL({
    oneLinkURL: defaultOneLinkUrl,
    afParameters: {
      mediaSource,
      afCustom: [
        campaignCode,
        afAdsetId,
        forceDeepLink,
        customSsUi,
        productDeepLink,
        productParam
      ].filter(Boolean)
    }
  });

  if (!result || !result.clickURL) {
    return;
  }

  const openInAppUrl = appendCurrentProduct(result.clickURL);
  appLinks.forEach((link) => {
    link.href = openInAppUrl;
  });
}

function getSelectedProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function appendCurrentProduct(url) {
  const productId = getSelectedProductId();
  if (!productId) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}product_id=${encodeURIComponent(productId)}`;
}
