// ===== Módulo principal de la aplicación =====

// ---------- Utilidades ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Sanitización básica para prevenir XSS
function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ---------- Datos de productos (simulados) ----------
const products = [
    {
        id: 1,
        name: "Cartucho Indica Night",
        strain: "indica",
        potency: "THC 85%",
        price: 45.00,
        description: "Efecto relajante profundo, ideal para la noche.",
        image: "https://placehold.co/300x200/0f172a/10b981?text=Indica"
    },
    {
        id: 2,
        name: "Cartucho Sativa Sunrise",
        strain: "sativa",
        potency: "THC 80%",
        price: 42.00,
        description: "Energía y creatividad para el día.",
        image: "https://placehold.co/300x200/0f172a/10b981?text=Sativa"
    },
    {
        id: 3,
        name: "Híbrida Balance",
        strain: "hibrida",
        potency: "THC 82%",
        price: 48.00,
        description: "Equilibrio perfecto entre cuerpo y mente.",
        image: "https://placehold.co/300x200/0f172a/10b981?text=H%C3%ADbrida"
    },
    {
        id: 4,
        name: "Indica Purple Kush",
        strain: "indica",
        potency: "THC 88%",
        price: 55.00,
        description: "Potente efecto sedante, sabor a uva.",
        image: "https://placehold.co/300x200/0f172a/10b981?text=Purple"
    },
    {
        id: 5,
        name: "Sativa Haze",
        strain: "sativa",
        potency: "THC 78%",
        price: 40.00,
        description: "Aroma cítrico, efecto eufórico.",
        image: "https://placehold.co/300x200/0f172a/10b981?text=Haze"
    },
    {
        id: 6,
        name: "Híbrida Gelato",
        strain: "hibrida",
        potency: "THC 84%",
        price: 50.00,
        description: "Dulce y cremosa, relajación sin somnolencia.",
        image: "https://placehold.co/300x200/0f172a/10b981?text=Gelato"
    }
];

// ---------- Estado del carrito ----------
let cart = JSON.parse(localStorage.getItem('vapeCart')) || [];

// ---------- Age Gate ----------
const ageGate = $('#ageGate');
const ageYes = $('#ageYes');
const ageNo = $('#ageNo');

function checkAge() {
    const ageConfirmed = localStorage.getItem('vapeAgeConfirmed');
    if (!ageConfirmed) {
        ageGate.classList.remove('hidden');
    } else {
        ageGate.classList.add('hidden');
    }
}

ageYes.addEventListener('click', () => {
    localStorage.setItem('vapeAgeConfirmed', 'true');
    ageGate.classList.add('hidden');
});

ageNo.addEventListener('click', () => {
    // Redirigir a página externa o mostrar mensaje
    window.location.href = 'https://www.google.com';
});

// ---------- Render de productos ----------
const productGrid = $('#productGrid');
let currentFilter = 'all';

function renderProducts(filter = 'all') {
    const filtered = filter === 'all' ? products : products.filter(p => p.strain === filter);
    productGrid.innerHTML = filtered.map(p => `
        <div class="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-all group">
            <div class="relative overflow-hidden">
                <img src="${p.image}" alt="${p.name}" class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300">
                <span class="absolute top-2 left-2 bg-emerald-500 text-slate-900 text-xs font-bold px-2 py-1 rounded-full">${p.potency}</span>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-lg mb-1">${p.name}</h3>
                <p class="text-sm text-slate-400 mb-3">${p.description}</p>
                <div class="flex items-center justify-between">
                    <span class="text-emerald-400 font-bold text-lg">$${p.price.toFixed(2)}</span>
                    <div class="flex gap-2">
                        <button data-quickview="${p.id}" class="text-slate-400 hover:text-emerald-400 transition-colors" title="Vista rápida">
                            <i data-lucide="eye" class="w-5 h-5"></i>
                        </button>
                        <button data-add="${p.id}" class="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-3 py-1 rounded-lg text-sm font-medium transition-all">Añadir</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    // Inicializar iconos Lucide después de renderizar
    if (window.lucide) {
        lucide.createIcons();
    }
}

// ---------- Filtros ----------
$$('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        $$('.filter-btn').forEach(b => {
            b.classList.remove('bg-emerald-500', 'text-slate-900');
            b.classList.add('bg-slate-800');
        });
        btn.classList.add('bg-emerald-500', 'text-slate-900');
        btn.classList.remove('bg-slate-800');
        renderProducts(currentFilter);
    });
});

// ---------- Quick View ----------
const quickViewModal = $('#quickViewModal');
const quickViewTitle = $('#quickViewTitle');
const quickViewBody = $('#quickViewBody');
const closeQuickView = $('#closeQuickView');

function openQuickView(id) {
    const product = products.find(p => p.id === Number(id));
    if (!product) return;
    quickViewTitle.textContent = product.name;
    quickViewBody.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover rounded-lg">
        <p class="text-slate-300">${product.description}</p>
        <div class="flex justify-between items-center">
            <span class="text-emerald-400 font-bold text-2xl">$${product.price.toFixed(2)}</span>
            <button data-add="${product.id}" class="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded-lg font-medium transition-all">Añadir al Carrito</button>
        </div>
    `;
    quickViewModal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

closeQuickView.addEventListener('click', () => quickViewModal.classList.add('hidden'));
quickViewModal.addEventListener('click', (e) => {
    if (e.target === quickViewModal) quickViewModal.classList.add('hidden');
});

// ---------- Carrito ----------
const cartButton = $('#cartButton');
const cartDrawer = $('#cartDrawer');
const cartOverlay = $('#cartOverlay');
const closeCart = $('#closeCart');
const cartItems = $('#cartItems');
const cartCount = $('#cartCount');
const cartSubtotal = $('#cartSubtotal');
const cartTax = $('#cartTax');
const shippingInfo = $('#shippingInfo');
const shippingBar = $('#shippingBar');
const shippingMessage = $('#shippingMessage');

function saveCart() {
    localStorage.setItem('vapeCart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = totalItems;

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const tax = subtotal * 0.08;
    const shippingThreshold = 50;
    const shipping = subtotal >= shippingThreshold ? 0 : 5.99;
    const total = subtotal + tax + shipping;

    cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    cartTax.textContent = `$${tax.toFixed(2)}`;
    shippingInfo.textContent = shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`;

    const progress = Math.min((subtotal / shippingThreshold) * 100, 100);
    shippingBar.style.width = `${progress}%`;
    shippingMessage.textContent = subtotal >= shippingThreshold
        ? '¡Envío gratis aplicado!'
        : `Añade $${(shippingThreshold - subtotal).toFixed(2)} para envío gratis`;

    // Render items
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-slate-400 text-center py-8">Tu carrito está vacío</p>';
    } else {
        cartItems.innerHTML = cart.map(item => {
            const product = products.find(p => p.id === item.id);
            return `
                <div class="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg">
                    <img src="${product.image}" alt="${product.name}" class="w-16 h-16 object-cover rounded">
                    <div class="flex-1">
                        <h4 class="font-medium text-sm">${product.name}</h4>
                        <p class="text-xs text-slate-400">$${product.price.toFixed(2)}</p>
                        <div class="flex items-center gap-2 mt-1">
                            <button data-dec="${item.id}" class="text-slate-400 hover:text-white px-1">−</button>
                            <span class="text-sm">${item.qty}</span>
                            <button data-inc="${item.id}" class="text-slate-400 hover:text-white px-1">+</button>
                        </div>
                    </div>
                    <button data-remove="${item.id}" class="text-red-400 hover:text-red-300 transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
        }).join('');
        if (window.lucide) lucide.createIcons();
    }
}

function addToCart(id) {
    const product = products.find(p => p.id === Number(id));
    if (!product) return;
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id: product.id, qty: 1, price: product.price });
    }
    saveCart();
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === Number(id));
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== Number(id));
    }
    saveCart();
}

function removeItem(id) {
    cart = cart.filter(i => i.id !== Number(id));
    saveCart();
}

// Event delegation para botones dinámicos
document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add]');
    if (addBtn) {
        addToCart(addBtn.dataset.add);
        return;
    }
    const quickBtn = e.target.closest('[data-quickview]');
    if (quickBtn) {
        openQuickView(quickBtn.dataset.quickview);
        return;
    }
    const incBtn = e.target.closest('[data-inc]');
    if (incBtn) {
        changeQty(incBtn.dataset.inc, 1);
        return;
    }
    const decBtn = e.target.closest('[data-dec]');
    if (decBtn) {
        changeQty(decBtn.dataset.dec, -1);
        return;
    }
    const removeBtn = e.target.closest('[data-remove]');
    if (removeBtn) {
        removeItem(removeBtn.dataset.remove);
        return;
    }
});

// Abrir/cerrar drawer
cartButton.addEventListener('click', () => {
    cartDrawer.classList.remove('hidden');
    updateCartUI();
});
closeCart.addEventListener('click', () => cartDrawer.classList.add('hidden'));
cartOverlay.addEventListener('click', () => cartDrawer.classList.add('hidden'));

// ---------- FAQ ----------
const faqData = [
    {
        q: "¿Cuál es la edad mínima para comprar?",
        a: "Debes ser mayor de 21 años. Al confirmar la verificación de edad, aceptas cumplir con la legislación local."
    },
    {
        q: "¿Hacen envíos a todo el país?",
        a: "Sí, realizamos envíos discretos a todo el territorio nacional. El envío es gratuito para pedidos superiores a $50."
    },
    {
        q: "¿Cómo se realiza el pago?",
        a: "Aceptamos tarjetas de crédito/débito y criptomonedas. La pasarela de pago se integrará próximamente."
    },
    {
        q: "¿Los productos son legales?",
        a: "Nuestros productos cumplen con las regulaciones locales donde operamos. Verifica siempre la normativa de tu región."
    }
];

function renderFAQ() {
    const container = $('#faqAccordion');
    container.innerHTML = faqData.map((item, idx) => `
        <div class="border border-slate-800 rounded-lg overflow-hidden">
            <button class="w-full flex justify-between items-center p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors" data-faq-toggle="${idx}">
                <span class="font-medium">${item.q}</span>
                <i data-lucide="chevron-down" class="w-5 h-5 text-slate-400 transition-transform"></i>
            </button>
            <div class="faq-answer hidden p-4 bg-slate-900/50 text-slate-300 text-sm">
                ${item.a}
            </div>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-faq-toggle]');
    if (!toggle) return;
    const idx = toggle.dataset.faqToggle;
    const answer = toggle.parentElement.querySelector('.faq-answer');
    const icon = toggle.querySelector('i');
    answer.classList.toggle('hidden');
    icon.classList.toggle('rotate-180');
});

// ---------- Newsletter ----------
const newsletterForm = $('#newsletterForm');
const newsletterEmail = $('#newsletterEmail');
const newsletterMsg = $('#newsletterMsg');

newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = newsletterEmail.value.trim();
    if (!email) return;
    // Sanitizar
    const safeEmail = sanitize(email);
    // Simular envío
    newsletterMsg.textContent = `Gracias, ${safeEmail}. Te mantendremos informado.`;
    newsletterMsg.classList.remove('hidden');
    newsletterEmail.value = '';
});

// ---------- Inicialización ----------
function init() {
    checkAge();
    renderProducts();
    renderFAQ();
    updateCartUI();
    if (window.lucide) lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', init);
