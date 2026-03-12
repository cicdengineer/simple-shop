const STORAGE_KEY = "simple-shop-state-v2";

const defaultProducts = [
  {
    id: "prod-necklace",
    name: "Gold Layered Necklace",
    category: "Jewellery",
    price: 1799,
    cost: 980,
    stock: 12,
    sku: "JWL-101",
    description: "Textured multi-layer necklace for festive styling and premium gifting.",
    badge: "Best seller",
    image: createPlaceholderImage("Gold Layered Necklace", "#b4572c", "#f4d7b2")
  },
  {
    id: "prod-saree",
    name: "Handloom Silk Saree",
    category: "Apparel",
    price: 4299,
    cost: 2500,
    stock: 8,
    sku: "APR-204",
    description: "Rich drape with woven border designed for special occasions.",
    badge: "Limited",
    image: createPlaceholderImage("Handloom Silk Saree", "#1a4b52", "#c8d9db")
  },
  {
    id: "prod-lamp",
    name: "Brass Decor Lamp",
    category: "Home Decor",
    price: 2399,
    cost: 1310,
    stock: 15,
    sku: "HOM-311",
    description: "Statement brass finish accent to elevate entryways and living spaces.",
    badge: "New arrival",
    image: createPlaceholderImage("Brass Decor Lamp", "#865d36", "#eadbc8")
  },
  {
    id: "prod-bag",
    name: "Structured Leather Tote",
    category: "Accessories",
    price: 3199,
    cost: 1850,
    stock: 10,
    sku: "ACC-118",
    description: "Workday tote with a clean silhouette, wide opening, and durable finish.",
    badge: "Popular",
    image: createPlaceholderImage("Structured Leather Tote", "#6e3f30", "#e9d1c0")
  }
];

const defaultOrders = [
  {
    id: "ORD-1201",
    createdAt: "2026-03-10T11:30:00.000Z",
    customer: {
      name: "Asha Rao",
      email: "asha@example.com",
      phone: "+91 9876543210",
      address: "44 Green Avenue, Hyderabad"
    },
    items: [
      { productId: "prod-necklace", quantity: 1, price: 1799 },
      { productId: "prod-lamp", quantity: 1, price: 2399 }
    ],
    paymentMethod: "Cash on Delivery",
    status: "processing"
  }
];

function createPlaceholderImage(name, start, end) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#g)" rx="36" />
      <circle cx="450" cy="120" r="84" fill="rgba(255,255,255,0.14)" />
      <circle cx="160" cy="480" r="110" fill="rgba(255,255,255,0.14)" />
      <text x="60" y="330" fill="white" font-family="Segoe UI, Arial" font-size="120" font-weight="700">${initials}</text>
      <text x="60" y="405" fill="rgba(255,255,255,0.82)" font-family="Segoe UI, Arial" font-size="34">${name}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function initialState() {
  return {
    products: defaultProducts,
    cart: [],
    watchlist: [],
    account: { name: "", email: "", phone: "", address: "" },
    orders: defaultOrders
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = initialState();
    saveState(seeded);
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw);
    const base = initialState();
    return {
      ...base,
      ...parsed,
      products: Array.isArray(parsed.products) && parsed.products.length ? parsed.products : base.products,
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      watchlist: Array.isArray(parsed.watchlist) ? parsed.watchlist : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : base.orders,
      account: { ...base.account, ...(parsed.account || {}) }
    };
  } catch (error) {
    const seeded = initialState();
    saveState(seeded);
    return seeded;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

let state = loadState();
const page = document.body.dataset.page;

document.addEventListener("DOMContentLoaded", () => {
  if (page === "home") initHomePage();
  if (page === "account") initAccountPage();
  if (page === "admin") initAdminPage();
});

function initHomePage() {
  populateCategoryFilter();
  renderStorefront();
  document.getElementById("productSearch").addEventListener("input", renderStorefront);
  document.getElementById("categoryFilter").addEventListener("change", renderStorefront);
  document.getElementById("openCartButton").addEventListener("click", () => document.getElementById("catalog").scrollIntoView({ behavior: "smooth" }));
  document.getElementById("openWatchlistButton").addEventListener("click", () => document.getElementById("watchlistPreview").scrollIntoView({ behavior: "smooth" }));
  document.getElementById("checkoutButton").addEventListener("click", openCheckout);
  document.getElementById("closeCheckoutModal").addEventListener("click", closeCheckout);
  document.getElementById("checkoutModal").addEventListener("click", (event) => {
    if (event.target.id === "checkoutModal") closeCheckout();
  });
  document.getElementById("checkoutForm").addEventListener("submit", handleCheckout);
}

function initAccountPage() {
  const accountForm = document.getElementById("accountForm");
  fillAccountForm(accountForm);
  renderAccountWatchlist();
  renderRecentOrders(state.orders);

  accountForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(accountForm);
    state.account = {
      name: formData.get("name")?.toString().trim() || "",
      email: formData.get("email")?.toString().trim() || "",
      phone: formData.get("phone")?.toString().trim() || "",
      address: formData.get("address")?.toString().trim() || ""
    };
    saveAndSync();
    toast("Account details saved.");
  });

  document.getElementById("orderSearchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")?.toString().trim().toLowerCase() || "";
    const phone = formData.get("phone")?.toString().trim() || "";
    const results = state.orders.filter((order) => {
      const matchesEmail = email && order.customer.email.toLowerCase() === email;
      const matchesPhone = phone && order.customer.phone === phone;
      return matchesEmail || matchesPhone;
    });
    renderSearchResults(results);
  });
}

function initAdminPage() {
  renderInventoryTable();
  renderAdminOrders();
  document.getElementById("inventoryForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const imageFile = formData.get("imageFile");
    let image = formData.get("image")?.toString().trim() || "";
    if (imageFile instanceof File && imageFile.size > 0) image = await fileToDataUrl(imageFile);

    const name = formData.get("name")?.toString().trim() || "";
    const product = {
      id: `prod-${Date.now()}`,
      name,
      category: formData.get("category")?.toString().trim() || "General",
      price: Number(formData.get("price") || 0),
      cost: Number(formData.get("cost") || 0),
      stock: Number(formData.get("stock") || 0),
      sku: formData.get("sku")?.toString().trim() || "",
      description: formData.get("description")?.toString().trim() || "",
      badge: formData.get("badge")?.toString().trim() || "New",
      image: image || createPlaceholderImage(name || "Product", "#1a4b52", "#d0dbd8")
    };

    state.products = [product, ...state.products];
    saveAndSync();
    form.reset();
    renderInventoryTable();
    renderAdminOrders();
    toast("Product added to inventory.");
  });
}

function populateCategoryFilter() {
  const categoryFilter = document.getElementById("categoryFilter");
  const categories = [...new Set(state.products.map((product) => product.category))].sort();
  categoryFilter.innerHTML = `<option value="all">All categories</option>${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}`;
}

function renderStorefront() {
  renderProductGrid();
  renderCart();
  renderWatchlistPreview();
  updateCounts();
}

function renderProductGrid() {
  const search = document.getElementById("productSearch").value.trim().toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const productGrid = document.getElementById("productGrid");
  const filteredProducts = state.products.filter((product) => {
    const matchesSearch = !search || product.name.toLowerCase().includes(search) || product.category.toLowerCase().includes(search) || product.description.toLowerCase().includes(search);
    const matchesCategory = category === "all" || product.category === category;
    return matchesSearch && matchesCategory;
  });

  if (!filteredProducts.length) {
    productGrid.innerHTML = `<div class="empty-state surface">No products match the current search.</div>`;
    return;
  }

  productGrid.innerHTML = filteredProducts.map((product) => {
    const isWatched = state.watchlist.includes(product.id);
    return `
      <article class="product-card">
        <div class="product-image-wrap">
          <img src="${product.image}" alt="${escapeHtml(product.name)}">
          <span class="badge">${escapeHtml(product.badge || "Featured")}</span>
        </div>
        <div class="product-card-body">
          <p class="eyebrow">${escapeHtml(product.category)}</p>
          <h3>${escapeHtml(product.name)}</h3>
          <p class="support-text">${escapeHtml(product.description)}</p>
          <div class="product-price">
            <strong>${currency(product.price)}</strong>
            <del>${currency(Math.round(product.price * 1.18))}</del>
          </div>
          <div class="product-actions">
            <button class="primary-button full-width" type="button" onclick="addToCart('${product.id}')">Add to cart</button>
            <button class="ghost-button" type="button" onclick="toggleWatchlist('${product.id}')">${isWatched ? "Saved" : "Watchlist"}</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const items = state.cart.map((line) => {
    const product = state.products.find((entry) => entry.id === line.productId);
    return product ? { ...line, product } : null;
  }).filter(Boolean);

  if (!items.length) {
    cartItems.className = "stack-list empty-state";
    cartItems.innerHTML = "Your cart is empty.";
  } else {
    cartItems.className = "stack-list";
    cartItems.innerHTML = items.map((line) => `
      <div class="cart-entry">
        <img src="${line.product.image}" alt="${escapeHtml(line.product.name)}">
        <div>
          <strong>${escapeHtml(line.product.name)}</strong>
          <div class="support-text">${currency(line.product.price)} each</div>
          <div class="mini-row">
            <button class="mini-button" type="button" onclick="changeCartQuantity('${line.productId}', -1)">-</button>
            <span>Qty ${line.quantity}</span>
            <button class="mini-button" type="button" onclick="changeCartQuantity('${line.productId}', 1)">+</button>
          </div>
        </div>
        <div><strong>${currency(line.product.price * line.quantity)}</strong></div>
      </div>
    `).join("");
  }

  const subtotal = items.reduce((sum, line) => sum + (line.product.price * line.quantity), 0);
  document.getElementById("cartSubtotal").textContent = currency(subtotal);
}
function renderWatchlistPreview() {
  const container = document.getElementById("watchlistPreview");
  const items = state.watchlist.map((productId) => state.products.find((product) => product.id === productId)).filter(Boolean).slice(0, 4);

  if (!items.length) {
    container.className = "stack-list empty-state";
    container.innerHTML = "Save products to keep them visible here.";
    return;
  }

  container.className = "stack-list";
  container.innerHTML = items.map((product) => `
    <div class="watchlist-entry">
      <div>
        <strong>${escapeHtml(product.name)}</strong>
        <div class="support-text">${escapeHtml(product.category)} • ${currency(product.price)}</div>
      </div>
      <div class="action-row">
        <button class="mini-button" type="button" onclick="addToCart('${product.id}')">Add to cart</button>
        <button class="mini-button" type="button" onclick="toggleWatchlist('${product.id}')">Remove</button>
      </div>
    </div>
  `).join("");
}

function updateCounts() {
  const cartCount = state.cart.reduce((sum, line) => sum + line.quantity, 0);
  const watchlistCount = state.watchlist.length;
  document.getElementById("cartCount").textContent = cartCount;
  document.getElementById("watchlistCount").textContent = watchlistCount;
  document.getElementById("heroProductCount").textContent = state.products.length;
  document.getElementById("heroWatchlistCount").textContent = watchlistCount;
}

function fillAccountForm(form) {
  form.elements.name.value = state.account.name;
  form.elements.email.value = state.account.email;
  form.elements.phone.value = state.account.phone;
  form.elements.address.value = state.account.address;
}

function renderAccountWatchlist() {
  const container = document.getElementById("accountWatchlist");
  const items = state.watchlist.map((productId) => state.products.find((product) => product.id === productId)).filter(Boolean);

  if (!items.length) {
    container.className = "stack-list empty-state";
    container.innerHTML = "No watchlist items yet.";
    return;
  }

  container.className = "stack-list";
  container.innerHTML = items.map((product) => `
    <div class="watchlist-entry">
      <div>
        <strong>${escapeHtml(product.name)}</strong>
        <div class="support-text">${escapeHtml(product.category)} • ${currency(product.price)}</div>
      </div>
      <a class="mini-button" href="index.html">Open product</a>
    </div>
  `).join("");
}

function renderRecentOrders(orders) {
  const container = document.getElementById("recentOrders");
  if (!orders.length) {
    container.className = "stack-list empty-state";
    container.innerHTML = "Orders placed from checkout will appear here.";
    return;
  }

  const latestOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  container.className = "stack-list";
  container.innerHTML = latestOrders.map(orderCardMarkup).join("");
}

function renderSearchResults(orders) {
  const container = document.getElementById("orderSearchResults");
  if (!orders.length) {
    container.className = "stack-list empty-state";
    container.innerHTML = "No orders found for the provided email or phone number.";
    return;
  }

  container.className = "stack-list";
  container.innerHTML = orders.map(orderCardMarkup).join("");
}

function orderCardMarkup(order) {
  const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return `
    <article class="order-card">
      <div class="action-row">
        <strong>${order.id}</strong>
        <span class="status-pill ${order.status}">${titleCase(order.status)}</span>
      </div>
      <div class="support-text">${new Date(order.createdAt).toLocaleString("en-IN")}</div>
      <div class="support-text">${escapeHtml(order.customer.name)} • ${escapeHtml(order.customer.email)} • ${escapeHtml(order.customer.phone)}</div>
      <div class="support-text">${escapeHtml(order.customer.address)}</div>
      <div class="stack-list">
        ${order.items.map((item) => {
          const product = state.products.find((entry) => entry.id === item.productId);
          return `<div class="order-line"><span>${escapeHtml(product?.name || "Product")} x ${item.quantity}</span><strong>${currency(item.price * item.quantity)}</strong></div>`;
        }).join("")}
      </div>
      <div class="action-row">
        <strong>${currency(total)}</strong>
        <span class="support-text">${order.paymentMethod}</span>
      </div>
    </article>
  `;
}

function renderInventoryTable() {
  const tbody = document.getElementById("inventoryTableBody");
  tbody.innerHTML = state.products.map((product) => `
    <tr>
      <td>
        <div class="mini-row">
          <img class="table-thumb" src="${product.image}" alt="${escapeHtml(product.name)}">
          <div>
            <strong>${escapeHtml(product.name)}</strong>
            <div class="support-text">${escapeHtml(product.sku)}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(product.category)}</td>
      <td>${currency(product.price)}</td>
      <td>${currency(product.cost)}</td>
      <td>${product.stock}</td>
      <td><button class="mini-button" type="button" onclick="removeProduct('${product.id}')">Remove</button></td>
    </tr>
  `).join("");
}

function renderAdminOrders() {
  const container = document.getElementById("adminOrders");
  if (!state.orders.length) {
    container.className = "stack-list empty-state";
    container.innerHTML = "Orders placed on the storefront will appear here.";
    return;
  }

  container.className = "stack-list";
  container.innerHTML = [...state.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((order) => {
    const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return `
      <article class="order-card">
        <div class="section-header">
          <div>
            <p class="eyebrow">${order.id}</p>
            <h3 class="card-title">${escapeHtml(order.customer.name)}</h3>
          </div>
          <span class="status-pill ${order.status}">${titleCase(order.status)}</span>
        </div>
        <div class="support-text">${escapeHtml(order.customer.email)} • ${escapeHtml(order.customer.phone)}</div>
        <div class="support-text">${escapeHtml(order.customer.address)}</div>
        <div class="support-text">${new Date(order.createdAt).toLocaleString("en-IN")} • ${order.paymentMethod}</div>
        <div class="stack-list">
          ${order.items.map((item) => {
            const product = state.products.find((entry) => entry.id === item.productId);
            return `<div class="order-line"><span>${escapeHtml(product?.name || "Product")} x ${item.quantity}</span><strong>${currency(item.price * item.quantity)}</strong></div>`;
          }).join("")}
        </div>
        <div class="action-row">
          <select onchange="updateOrderStatus('${order.id}', this.value)">
            ${["pending", "processing", "shipped", "delivered"].map((status) => `<option value="${status}" ${order.status === status ? "selected" : ""}>${titleCase(status)}</option>`).join("")}
          </select>
          <strong>${currency(total)}</strong>
        </div>
      </article>
    `;
  }).join("");
}

function addToCart(productId) {
  const product = state.products.find((entry) => entry.id === productId);
  if (!product) return;
  if (product.stock <= 0) {
    toast("This product is out of stock.");
    return;
  }

  const line = state.cart.find((entry) => entry.productId === productId);
  if (line) {
    if (line.quantity >= product.stock) {
      toast("No more stock available for this product.");
      return;
    }
    line.quantity += 1;
  } else {
    state.cart.push({ productId, quantity: 1 });
  }

  saveAndSync();
  if (page === "home") renderStorefront();
  toast(`${product.name} added to cart.`);
}

function changeCartQuantity(productId, delta) {
  const line = state.cart.find((entry) => entry.productId === productId);
  const product = state.products.find((entry) => entry.id === productId);
  if (!line || !product) return;

  line.quantity += delta;
  if (line.quantity > product.stock) line.quantity = product.stock;
  if (line.quantity <= 0) state.cart = state.cart.filter((entry) => entry.productId !== productId);

  saveAndSync();
  if (page === "home") renderStorefront();
}
function toggleWatchlist(productId) {
  const inWatchlist = state.watchlist.includes(productId);
  state.watchlist = inWatchlist ? state.watchlist.filter((entry) => entry !== productId) : [productId, ...state.watchlist];
  saveAndSync();
  if (page === "home") renderStorefront();
  if (page === "account") renderAccountWatchlist();
  toast(inWatchlist ? "Removed from watchlist." : "Saved to watchlist.");
}

function openCheckout() {
  if (!state.cart.length) {
    toast("Add at least one product to cart before checkout.");
    return;
  }

  const form = document.getElementById("checkoutForm");
  form.elements.name.value = state.account.name;
  form.elements.email.value = state.account.email;
  form.elements.phone.value = state.account.phone;
  form.elements.address.value = state.account.address;
  document.getElementById("checkoutModal").classList.add("is-open");
  document.getElementById("checkoutModal").setAttribute("aria-hidden", "false");
}

function closeCheckout() {
  const modal = document.getElementById("checkoutModal");
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function handleCheckout(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const account = {
    name: formData.get("name")?.toString().trim() || "",
    email: formData.get("email")?.toString().trim() || "",
    phone: formData.get("phone")?.toString().trim() || "",
    address: formData.get("address")?.toString().trim() || ""
  };

  const orderItems = state.cart.map((line) => {
    const product = state.products.find((entry) => entry.id === line.productId);
    return product ? { productId: product.id, quantity: line.quantity, price: product.price } : null;
  }).filter(Boolean);

  if (!orderItems.length) {
    toast("Cart is empty.");
    return;
  }

  state.products = state.products.map((product) => {
    const line = state.cart.find((entry) => entry.productId === product.id);
    if (!line) return product;
    return { ...product, stock: Math.max(0, product.stock - line.quantity) };
  });

  state.account = account;
  state.orders = [{
    id: `ORD-${Math.floor(Date.now() / 1000)}`,
    createdAt: new Date().toISOString(),
    customer: account,
    items: orderItems,
    paymentMethod: "Cash on Delivery",
    status: "pending"
  }, ...state.orders];
  state.cart = [];
  saveAndSync();
  closeCheckout();
  renderStorefront();
  toast("Order placed with cash on delivery.");
}

function removeProduct(productId) {
  state.products = state.products.filter((product) => product.id !== productId);
  state.watchlist = state.watchlist.filter((entry) => entry !== productId);
  state.cart = state.cart.filter((entry) => entry.productId !== productId);
  state.orders = state.orders.map((order) => ({ ...order, items: order.items.filter((item) => item.productId !== productId) })).filter((order) => order.items.length > 0);
  saveAndSync();
  renderInventoryTable();
  renderAdminOrders();
  toast("Product removed from inventory.");
}

function updateOrderStatus(orderId, status) {
  state.orders = state.orders.map((order) => order.id === orderId ? { ...order, status } : order);
  saveAndSync();
  renderAdminOrders();
  toast(`Order ${orderId} marked as ${titleCase(status)}.`);
}

function saveAndSync() {
  saveState(state);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function titleCase(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

let toastTimer;
function toast(message) {
  const toastNode = document.getElementById("toast");
  if (!toastNode) return;
  toastNode.textContent = message;
  toastNode.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastNode.classList.remove("is-visible"), 2200);
}

window.addToCart = addToCart;
window.toggleWatchlist = toggleWatchlist;
window.changeCartQuantity = changeCartQuantity;
window.removeProduct = removeProduct;
window.updateOrderStatus = updateOrderStatus;
