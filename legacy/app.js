// =====================================================================
//  Módulo frontal del carrito y checkout
// =====================================================================

// ---------------------------------------------------------------------
//  SEGURIDAD COMERCIAL
//  - No se exponen nombres reales de productos en el flujo de pago.
//  - El importe NO viaja por la URL: el frontend solo envía el total a
//    /api/create-checkout-session y el backend crea la sesión de Stripe.
// ---------------------------------------------------------------------

// Nombre genérico y neutral que representa cualquier artículo del
// catálogo frente a la pasarela y a los resúmenes de pedido.
const DEFAULT_ITEM_LABEL = "Suministro Estándar";

// ---------------------------------------------------------------------
//  Utilidades DOM y sanitización
// ---------------------------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Previene inyección de HTML/XSS al mostrar strings de usuario o datos.
function sanitize(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}

// Toast simple de feedback (no intrusivo).
function showToast(message) {
  const t = document.createElement("div");
  t.textContent = message;
  t.className =
    "fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] bg-emerald-600 text-white text-sm font-medium px-5 py-3 rounded-lg shadow-2xl transition-opacity duration-300 opacity-0";
  document.body.appendChild(t);
  requestAnimationFrame(() => (t.style.opacity = "1"));
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 300);
  }, 2200);
}

// ---------------------------------------------------------------------
//  Catálogo (metadatos visuales ricos, sin nombres sensibles)
// ---------------------------------------------------------------------
//  Estructura:
//   - Atributos TÉCNICOS (id, strain, format, label, price) se usan para
//     filtros y lógica de carrito/checkout.
//   - Atributos VISUALES (name, thc, effects, terpenes, unit, img, tone)
//     se usan exclusivamente para renderizar la experiencia premium de
//     la interfaz. NUNCA viajan a la pasarela de pago.
//
//  format: "cartucho" (vape 510) | "desechable"
//  tone:   mapea a un gradiente sutil por tipo de cepa para la tarjeta.
// ---------------------------------------------------------------------
const products = [
  { id: 1, strain: "indica", format: "cartucho", label: DEFAULT_ITEM_LABEL, price: 45.0 },
  { id: 2, strain: "sativa", format: "cartucho", label: DEFAULT_ITEM_LABEL, price: 42.0 },
  { id: 3, strain: "hibrida", format: "cartucho", label: DEFAULT_ITEM_LABEL, price: 48.0 },
  { id: 4, strain: "indica", format: "desechable", label: DEFAULT_ITEM_LABEL, price: 55.0 },
  { id: 5, strain: "sativa", format: "desechable", label: DEFAULT_ITEM_LABEL, price: 40.0 },
  { id: 6, strain: "hibrida", format: "desechable", label: DEFAULT_ITEM_LABEL, price: 50.0 },
];

// Metadatos visuales (UI solamente). "tint" define el acento de carga
// de la tarjeta (mercado claro de estilo Eaze) por tipo de cepa.
const productMeta = [
  {
    id: 1,
    name: "Ébano Nocturno",
    thc: 85,
    effects: "Relajación profunda y serenidad",
    terpenes: "Mirceno · Limoneno",
    unit: "Cartucho 510",
    img: "https://placehold.co/480x360/F3F4F6/4B5563?text=Nocturno",
  },
  {
    id: 2,
    name: "Ámbar Alba",
    thc: 80,
    effects: "Energía clara y enfoque",
    terpenes: "Limoneno · Pineno",
    unit: "Cartucho 510",
    img: "https://placehold.co/480x360/F3F4F6/4B5563?text=Alba",
  },
  {
    id: 3,
    name: "Esmeralda Balance",
    thc: 82,
    effects: "Armonía entre cuerpo y mente",
    terpenes: "Cariofileno · Limoneno",
    unit: "Cartucho 510",
    img: "https://placehold.co/480x360/F3F4F6/4B5563?text=Balance",
  },
  {
    id: 4,
    name: "Nébula Indigo",
    thc: 88,
    effects: "Calma profunda y alivio",
    terpenes: "Mirceno · Cariofileno",
    unit: "Desechable 1g",
    img: "https://placehold.co/480x360/F3F4F6/4B5563?text=Indigo",
  },
  {
    id: 5,
    name: "Cítrico Haze",
    thc: 78,
    effects: "Efecto eufórico y creativo",
    terpenes: "Limoneno · Terpinoleno",
    unit: "Desechable 1g",
    img: "https://placehold.co/480x360/F3F4F6/4B5563?text=Haze",
  },
  {
    id: 6,
    name: "Gelato Real",
    thc: 84,
    effects: "Equilibrio dulce y sutil",
    terpenes: "Limoneno · Beta-Cariofileno",
    unit: "Desechable 1g",
    img: "https://placehold.co/480x360/F3F4F6/4B5563?text=Gelato",
  },
];

// Acentos vivos por cepa sobre fondo claro (marketplace estilo Eaze).
const STRAIN_VISUAL = {
  sativa: { label: "Sativa", pill: "bg-amber-100 text-amber-800", dot: "bg-amber-400" },
  indica: { label: "Indica", pill: "bg-violet-100 text-violet-800", dot: "bg-violet-400" },
  hibrida: { label: "Híbrida", pill: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-400" },
};

function getProduct(id) {
  return products.find((p) => p.id === Number(id));
}

function getMeta(id) {
  return productMeta.find((m) => m.id === Number(id)) || {};
}

// Expone el nombre visual SOLO para la UI; el checkout sigue usando el
// label genérico neutral. El carrito internamente referencia por id.
function getDisplayName(id) {
  return getMeta(id).name || DEFAULT_ITEM_LABEL;
}

// ---------------------------------------------------------------------
//  Estado del carrito (en memoria + persistencia local opcional)
// ---------------------------------------------------------------------
let cart = JSON.parse(localStorage.getItem("shopCart")) || [];

const FREE_SHIPPING_AT = 50; // Envío gratis a partir de este subtotal
const FLAT_SHIPPING = 5.0;   // Costo fijo por debajo del umbral

// ---------------------------------------------------------------------
//  Lógica base del carrito
// ---------------------------------------------------------------------
function addToCart(id) {
  const product = products.find((p) => p.id === Number(id));
  if (!product) return;

  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: product.id, qty: 1, price: product.price, label: product.label });
  }
    saveCart();
  showToast("Artículo añadido al carrito.");
}

// Feedback visual de "¡Añadido!" sobre el botón (ícono ✓ + texto).
function animateAdded(btn) {
  if (!btn) return;
  const plusIcon = btn.querySelector('[data-icon-plus]');
  const checkIcon = btn.querySelector('[data-icon-check]');
  const label = btn.querySelector('[data-btn-label]');

  if (plusIcon) plusIcon.classList.add("hidden");
  if (checkIcon) checkIcon.classList.remove("hidden");
  if (label) label.textContent = "¡Añadido!";
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    if (plusIcon) plusIcon.classList.remove("hidden");
    if (checkIcon) checkIcon.classList.add("hidden");
    if (label) label.textContent = "Agregar";
    if (window.lucide) lucide.createIcons();
  }, 1400);
}

function changeQty(id, delta) {
  const item = cart.find((i) => i.id === Number(id));
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((i) => i.id !== Number(id));
  }
  saveCart();
}

function removeItem(id) {
  cart = cart.filter((i) => i.id !== Number(id));
  saveCart();
}

function saveCart() {
  localStorage.setItem("shopCart", JSON.stringify(cart));
  renderCartSummary();
  renderCartItems();
}

// ---------------------------------------------------------------------
//  Render del contenido del carrito (drawer)
// ---------------------------------------------------------------------
function renderCartItems() {
  const container = $("#cartItems");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `<p class="text-sm text-slate-400 text-center py-10">Tu carrito está vacío.</p>`;
    return;
  }

    container.innerHTML = cart
    .map((item) => {
      const meta = getMeta(item.id);
      const prodName = meta?.name || DEFAULT_ITEM_LABEL;
      return `
      <div class="flex items-start gap-3 border-b border-white/10 pb-4">
        <img src="${meta.img || ""}" alt="${sanitize(prodName)}" class="w-16 h-16 object-cover rounded-lg bg-white/5 flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <h4 class="font-medium text-sm text-slate-100">${sanitize(prodName)}</h4>
          <p class="text-xs text-slate-400 mt-1">${sanitize(meta?.unit || "")}</p>
          <div class="flex items-center justify-between mt-3 w-full">
            <div class="flex items-center gap-3">
              <button class="cart-qty-btn text-emerald-300 text-xl leading-none hover:text-emerald-200 px-1" data-id="${item.id}" data-action="dec" aria-label="Disminuir">−</button>
              <span class="text-sm font-semibold text-center w-5">${item.qty}</span>
              <button class="cart-qty-btn text-emerald-300 text-xl leading-none hover:text-emerald-200 px-1" data-id="${item.id}" data-action="inc" aria-label="Incrementar">+</button>
            </div>
            <button class="cart-remove-btn text-slate-400 hover:text-red-400 transition-colors" data-id="${item.id}" aria-label="Eliminar">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        <p class="text-emerald-300 font-semibold text-sm whitespace-nowrap ml-2">$${item.price.toFixed(2)}</p>
      </div>
    `;
    })
    .join("");

  if (window.lucide) lucide.createIcons();
}

// ---------------------------------------------------------------------
//  Resumen y cálculo en tiempo real
// ---------------------------------------------------------------------
function renderCartSummary() {
  const subtotalEl = $("#cartSubtotal");
  const taxEl = $("#cartTax");
  const shippingEl = $("#shippingInfo");
  const totalEl = $("#cartTotal");
  const countEl = $("#cartCount");
  const barEl = $("#shippingBar");
  const msgEl = $("#shippingMessage");

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const tax = 0; // Sin cargos impositivos en este flujo
  const shipping = subtotal >= FREE_SHIPPING_AT || subtotal === 0 ? 0 : FLAT_SHIPPING;
  const total = subtotal + tax + shipping;
  const count = cart.reduce((acc, item) => acc + item.qty, 0);

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
  if (shippingEl) shippingEl.textContent = shipping === 0 ? "Gratis" : `$${shipping.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  if (countEl) countEl.textContent = count;

  if (barEl && msgEl) {
    const progress = subtotal >= FREE_SHIPPING_AT ? 100 : (subtotal / FREE_SHIPPING_AT) * 100;
    barEl.style.width = `${progress}%`;
    msgEl.textContent =
      subtotal >= FREE_SHIPPING_AT
        ? "¡Ya tienes envío gratis!"
        : `Te faltan $${(FREE_SHIPPING_AT - subtotal).toFixed(2)} para envío gratis.`;
  }

  window.__cartTotal = total;
}

// ---------------------------------------------------------------------
//  Control de apertura / cierre del drawer
// ---------------------------------------------------------------------
function openCart() {
  const drawer = $("#cartDrawer");
  if (!drawer) return;
  renderCartSummary();
  renderCartItems();
  drawer.classList.remove("hidden");
}

function closeCart() {
  const drawer = $("#cartDrawer");
  if (drawer) drawer.classList.add("hidden");
}

// ---------------------------------------------------------------------
//  Checkout final → sesión de Stripe creada en nuestro propio backend
// ---------------------------------------------------------------------
//  El frontend ya no usa un Payment Link estático. Envía el total del
//  carrito a /api/create-checkout-session y redirige a la URL de la
//  sesión que devuelve el servidor. El importe se valida y se cobra en
//  el backend, no en la URL.
// ---------------------------------------------------------------------

function computeCartTotal() {
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shipping = subtotal >= FREE_SHIPPING_AT || subtotal === 0 ? 0 : FLAT_SHIPPING;
  return Math.max(0, subtotal + shipping);
}

async function proceedToCheckout() {
  const cartTotal = window.__cartTotal || computeCartTotal();

  if (cartTotal <= 0) {
    alert("El carrito está vacío");
    return;
  }

  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalAmount: cartTotal }),
    });

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Error al generar la sesión de pago: ' + (data.error || 'Desconocido'));
    }
  } catch (error) {
    console.error('Error de red:', error);
    alert('Error al conectar con la pasarela de pagos.');
  }
}

// ---------------------------------------------------------------------
//  Render del catálogo (productos con data-* neutrales)
// ---------------------------------------------------------------------
const productGrid = $("#productGrid");
let currentFilter = "all";

// Lista de campos considerados tipo de cepa (para detectar filtros).
const STRAIN_FILTERS = ["indica", "sativa", "hibrida"];
const FORMAT_FILTERS = ["cartucho", "desechable"];

function getFilteredProducts(filter) {
  if (filter === "all") return [...products];
  if (STRAIN_FILTERS.includes(filter)) return products.filter((p) => p.strain === filter);
  if (FORMAT_FILTERS.includes(filter)) return products.filter((p) => p.format === filter);
  return products.filter((p) => p.strain === filter || p.format === filter);
}

function renderProducts(filter = "all") {
  if (!productGrid) return;

  const filtered = getFilteredProducts(filter);

  productGrid.innerHTML = filtered
    .map((p) => {
      const meta = getMeta(p.id);
      const visual = STRAIN_VISUAL[p.strain] || STRAIN_VISUAL.hibrida;
      const productName = meta?.name || p.label;
      const isDispensable = p.format === "desechable";
      const badge = isDispensable ? "Desechable 1g" : "Cartucho 510";

      return `
      <article
        class="product-card group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
        data-id="${p.id}"
        data-name="${sanitize(DEFAULT_ITEM_LABEL)}"
        data-price="${p.price.toFixed(2)}"
      >
        <!-- Imagen 3:2 + indicador de strain -->
        <div class="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <span class="absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${visual.pill}">
            <span class="h-1.5 w-1.5 rounded-full ${visual.dot}"></span>
            ${visual.label}
          </span>
          <img
            src="${meta.img || ""}"
            alt="${sanitize(productName)}"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <span class="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600 shadow-sm">
            ${sanitize(badge)}
          </span>
        </div>

        <!-- Detalles -->
        <div class="flex flex-1 flex-col p-4">
          <div class="mb-1 flex items-center justify-between gap-2">
            <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">${sanitize(meta?.effects || "")}</span>
          </div>

          <h3 class="font-semibold leading-snug text-gray-900">${sanitize(productName)}</h3>

          <p class="mt-1 text-xs text-gray-500">${sanitize(meta?.terpenes || "")}</p>

          <div class="mt-3 flex items-center justify-between">
            <div>
              <span class="text-lg font-bold text-gray-900">$${p.price.toFixed(2)}</span>
              <span class="ml-1 text-xs font-bold text-emerald-600">${meta?.thc || 0}% THC</span>
            </div>
            <button
              class="add-btn inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-500 active:scale-95"
              data-id="${p.id}"
            >
              <i data-lucide="plus" class="h-4 w-4" data-icon-plus="1"></i>
              <span class="hidden sm:inline" data-btn-label>Agregar</span>
              <i data-lucide="check" class="h-4 w-4 hidden" data-icon-check="1"></i>
            </button>
          </div>
        </div>
      </article>
    `;
    })
    .join("");

  if (window.lucide) lucide.createIcons();
}

// ---------------------------------------------------------------------
//  Filtros del catálogo
// ---------------------------------------------------------------------
function initFilters() {
  const ACTIVE_CLASSES = ["bg-emerald-500", "text-slate-900"];
  const INACTIVE_CLASSES = ["bg-emerald-500", "text-slate-900", "bg-slate-800", "hover:bg-slate-700"];

  $$(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;

      $$(".filter-btn").forEach((b) => {
        b.classList.remove(...ACTIVE_CLASSES, "bg-slate-800");
        b.classList.add("bg-slate-800", "hover:bg-slate-700");
      });

      btn.classList.remove("bg-slate-800", "hover:bg-slate-700");
      btn.classList.add("bg-emerald-500", "text-slate-900");

      renderProducts(currentFilter);
    });
  });
}

// ---------------------------------------------------------------------
//  FAQ (acordeón)
// ---------------------------------------------------------------------
const faqData = [
  { q: "¿Cuál es la edad mínima para comprar?", a: "Debes ser mayor de 21 años y aceptar los términos de uso." },
  { q: "¿Realizan envíos?", a: "Sí. El envío es gratuito a partir de $50 de pedido." },
  { q: "¿Qué métodos de pago aceptan?", a: "Usamos una pasarela de pago segura y neutral configurada para procesar tu orden." },
  { q: "¿Los productos son legales?", a: "Cumplen con la regulación local. Verifica siempre la normativa de tu región." },
];

function renderFAQ() {
  const container = $("#faqAccordion");
  if (!container) return;

  container.innerHTML = faqData
    .map(
      (item, idx) => `
      <div class="border border-slate-700 bg-white/5 rounded-xl overflow-hidden">
        <button class="faq-toggle w-full flex justify-between items-center p-4 hover:bg-white/5 transition-colors" data-faq-idx="${idx}">
          <span class="font-medium text-slate-100 text-left pr-4">${sanitize(item.q)}</span>
          <i data-lucide="chevron-down" class="faq-icon w-5 h-5 text-emerald-300 transition-transform flex-shrink-0"></i>
        </button>
        <div class="faq-content hidden px-4 pb-4 text-sm text-slate-400">${sanitize(item.a)}</div>
      </div>
    `
    )
    .join("");

  if (window.lucide) lucide.createIcons();
}

function initFAQAccordion() {
  document.addEventListener("click", (e) => {
    const toggle = e.target.closest(".faq-toggle");
    if (!toggle) return;

    const card = toggle.parentElement;
    const content = card.querySelector(".faq-content");
    const icon = card.querySelector(".faq-icon");

    // Comportamiento de acordeón: cerrar lo demás
    $$(".faq-content").forEach((c) => {
      if (c !== content) {
        c.classList.add("hidden");
        c.previousElementSibling?.querySelector(".faq-icon")?.classList.remove("rotate-180");
      }
    });

    const willOpen = content.classList.contains("hidden");
    content.classList.toggle("hidden", !willOpen);
    icon.classList.toggle("rotate-180", willOpen);
  });
}

// ---------------------------------------------------------------------
//  Newsletter (vista previa local)
// ---------------------------------------------------------------------
function initNewsletter() {
  const form = $("#newsletterForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#newsletterEmail");
    const msg = $("#newsletterMsg");
    const email = (input.value || "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (msg) {
        msg.textContent = "Ingresa un correo válido.";
        msg.classList.remove("hidden");
      }
      return;
    }

    if (msg) {
      msg.textContent = "Gracias. Te contactaremos pronto.";
      msg.classList.remove("hidden");
    }
    localStorage.setItem("newsletterSub", email);
    input.value = "";
  });
}

// ---------------------------------------------------------------------
//  Delegación global de eventos del documento
// ---------------------------------------------------------------------
document.addEventListener("click", (e) => {
  // Añadir al carrito
  const addBtn = e.target.closest(".add-btn, [data-add]");
  if (addBtn) {
    const id = addBtn.dataset.id || addBtn.dataset.add;
    if (id) {
      addToCart(id);
      // Feedback premium de "¡Añadido!"
      if (addBtn.classList.contains("add-btn")) animateAdded(addBtn);
      return;
    }
  }

  // Aumentar / disminuir / eliminar dentro del carrito
  const qtyBtn = e.target.closest(".cart-qty-btn");
  if (qtyBtn) {
    const { id, action } = qtyBtn.dataset;
    if (action === "inc") changeQty(id, 1);
    else if (action === "dec") changeQty(id, -1);
    return;
  }

  const removeBtn = e.target.closest(".cart-remove-btn");
  if (removeBtn) {
    removeItem(removeBtn.dataset.id);
    return;
  }

  // Abrir carrito
  if (e.target.closest("#cartButton")) {
    openCart();
    return;
  }

  // Cerrar carrito
  if (e.target.closest("#closeCart") || e.target.id === "cartOverlay") {
    closeCart();
    return;
  }

  // Checkout
  if (e.target.closest("#checkoutBtn")) {
    proceedToCheckout();
    return;
  }

  // Nota: el acordeón FAQ se gestiona en initFAQAccordion.
});

// Cerrar con tecla ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const qv = $("#quickViewModal");
    if (qv && !qv.classList.contains("hidden")) {
      qv.classList.add("hidden");
    }
    closeCart();
  }
});

// ---------------------------------------------------------------------
//  Inicialización
// ---------------------------------------------------------------------
function init() {
  renderProducts(currentFilter);
  initFilters();
  renderFAQ();
  initFAQAccordion();
  initNewsletter();
  renderCartSummary();
  renderCartItems();
}

document.addEventListener("DOMContentLoaded", init);