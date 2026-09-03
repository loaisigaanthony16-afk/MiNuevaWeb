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
//  Catálogo (metadatos neutrales, sin nombres sensibles)
// ---------------------------------------------------------------------
// Cada ítem solo contiene un identificador, la categoría de filtro,
// un nombre técnico genérico y su PRECIO. Nada viaja a Stripe como
// referencia a un producto delicado.
const products = [
  { id: 1, strain: "indica", label: DEFAULT_ITEM_LABEL, price: 45.0 },
  { id: 2, strain: "sativa", label: DEFAULT_ITEM_LABEL, price: 42.0 },
  { id: 3, strain: "hibrida", label: DEFAULT_ITEM_LABEL, price: 48.0 },
  { id: 4, strain: "indica", label: DEFAULT_ITEM_LABEL, price: 55.0 },
  { id: 5, strain: "sativa", label: DEFAULT_ITEM_LABEL, price: 40.0 },
  { id: 6, strain: "hibrida", label: DEFAULT_ITEM_LABEL, price: 50.0 },
];

// Presentación visual SOLO para la interfaz (jamás se envía a pagar).
const productMeta = [
  { id: 1, code: "ART-001", tag: "THC 85%", desc: "Efecto relajante profundo.", img: "https://placehold.co/300x200/0a3226/ffffff?text=ART-001" },
  { id: 2, code: "ART-002", tag: "THC 80%", desc: "Perfil energizante.", img: "https://placehold.co/300x200/0a3226/ffffff?text=ART-002" },
  { id: 3, code: "ART-003", tag: "THC 82%", desc: "Equilibrio completo.", img: "https://placehold.co/300x200/0a3226/ffffff?text=ART-003" },
  { id: 4, code: "ART-004", tag: "THC 88%", desc: "Potencia superior.", img: "https://placehold.co/300x200/0a3226/ffffff?text=ART-004" },
  { id: 5, code: "ART-005", tag: "THC 78%", desc: "Perfil ligero.", img: "https://placehold.co/300x200/0a3226/ffffff?text=ART-005" },
  { id: 6, code: "ART-006", tag: "THC 84%", desc: "Perfil suave.", img: "https://placehold.co/300x200/0a3226/ffffff?text=ART-006" },
];

function getMeta(id) {
  return productMeta.find((m) => m.id === Number(id)) || {};
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
      return `
      <div class="flex items-start gap-3 border-b border-white/10 pb-4">
        <img src="${meta.img || ""}" alt="${sanitize(item.label)}" class="w-16 h-16 object-cover rounded-lg bg-white/5 flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <h4 class="font-medium text-sm text-slate-100">${sanitize(item.label)}</h4>
          <p class="text-xs text-slate-400 mt-1">${sanitize(meta.code || "")}</p>
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

function renderProducts(filter = "all") {
  if (!productGrid) return;

  const filtered =
    filter === "all" ? products : products.filter((p) => p.strain === filter);

  productGrid.innerHTML = filtered
    .map((p) => {
      const meta = getMeta(p.id);
      return `
      <article
        class="bg-[#0a3226] border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/60 hover:shadow-xl transition-all"
        data-id="${p.id}"
        data-name="${sanitize(DEFAULT_ITEM_LABEL)}"
        data-price="${p.price.toFixed(2)}"
      >
        <div class="relative overflow-hidden h-48">
          <img src="${meta.img || ""}" alt="${sanitize(DEFAULT_ITEM_LABEL)}" class="w-full h-full object-cover" loading="lazy" />
          <span class="absolute top-3 left-3 bg-emerald-500 text-slate-900 text-xs font-bold px-2 py-1 rounded-full">${sanitize(meta.tag || "")}</span>
        </div>
        <div class="p-5">
          <h3 class="font-semibold text-lg text-slate-100">${sanitize(meta.code || p.label)}</h3>
          <p class="text-sm text-slate-400 mt-1 mb-4">${sanitize(meta.desc || "")}</p>
          <div class="flex items-center justify-between">
            <span class="text-emerald-300 font-bold text-xl">$${p.price.toFixed(2)}</span>
            <button
              class="add-btn inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-all"
              data-id="${p.id}"
            >
              <i data-lucide="plus" class="w-4 h-4"></i>
              Añadir
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
  $$(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      $$(".filter-btn").forEach((b) => {
        b.classList.remove("bg-emerald-500", "text-slate-900");
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
