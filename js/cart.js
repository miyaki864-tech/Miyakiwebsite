import { formatCurrency, parseCurrency } from './currency.js';
import { escapeHtml, normalizeAssetPath } from './utils/dom.js';

export function initCart() {
    const cartToggle  = document.getElementById('cart-toggle');
    const mobileCartToggle = document.getElementById('mobile-top-cart-btn');
    const cartDrawer  = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const checkoutBtn = document.querySelector('.checkout-btn');

    mobileCartToggle?.addEventListener('click', openCart);
    checkoutBtn?.addEventListener('click', (event) => {
        if (getCart().length === 0) event.preventDefault();
    });

    if (cartToggle && cartDrawer && cartOverlay && closeCartBtn) {
        cartToggle.addEventListener('click', openCart);
    }

    closeCartBtn?.addEventListener('click', closeCart);
    cartOverlay?.addEventListener('click', closeCart);
    document.addEventListener('click', (event) => {
        if (event.target.closest('#mobile-top-cart-btn')) {
            openCart(event);
        }
    });

    // Global listener for mobile top/bottom bar cart triggers
    window.addEventListener('openMobileCart', openCart);

    renderCart();
    window.addEventListener('cartUpdated', renderCart);
}

export function openCart(e) {
    if (e) e.preventDefault();
    document.getElementById('cart-drawer')?.classList.add('open');
    document.getElementById('cart-overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
}

export function closeCart() {
    document.getElementById('cart-drawer')?.classList.remove('open');
    document.getElementById('cart-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
}

export function getCart() {
    return JSON.parse(localStorage.getItem('miyaki_cart')) || [];
}

export function saveCart(cart) {
    localStorage.setItem('miyaki_cart', JSON.stringify(cart));
    renderCart();
}

export function addToCart(name, price, imgSrc) {
    const cart = getCart();
    cart.push({ name, price: formatCurrency(price), imgSrc });
    saveCart(cart);
    window.dispatchEvent(new Event('cartUpdated'));
    openCart();
}

export function renderCart() {
    const cart = getCart();
    const cartToggle  = document.getElementById('cart-toggle');
    const cartBody    = document.querySelector('.cart-body');
    const cartLeftPanel = document.querySelector('.cart-left-panel');
    const cartTotal   = document.querySelector('.cart-total strong');
    const cartCountLabel = document.getElementById('cart-count-label');
    const cartDrawer = document.getElementById('cart-drawer');
    const checkoutBtn = document.querySelector('.checkout-btn');

    if (cartToggle) cartToggle.textContent = `Cart (${cart.length})`;
    if (cartCountLabel) {
        cartCountLabel.textContent = `${cart.length} ${cart.length === 1 ? 'item' : 'items'}`;
    }
    cartDrawer?.classList.toggle('is-empty', cart.length === 0);
    checkoutBtn?.classList.toggle('is-disabled', cart.length === 0);

    // Mobile Badge Update
    const mobileBadge = document.getElementById('mobile-tab-badge');
    if (mobileBadge) {
        mobileBadge.textContent = cart.length;
        if (cart.length > 0) mobileBadge.classList.add('visible');
        else mobileBadge.classList.remove('visible');
    }

    if (!cartBody || !cartLeftPanel || !cartTotal) return;

    cartBody.innerHTML = '';

    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div class="cart-empty">
                <span class="cart-empty-kicker">Empty Cart</span>
                <strong>No pieces selected yet.</strong>
                <p>Add a ceramic piece from the shop and it will appear here for review.</p>
            </div>
        `;
        cartLeftPanel.querySelector('.cart-hero-image')?.setAttribute('src', 'assets/images/bowl.png');
        cartTotal.textContent = formatCurrency(0);
        return;
    }

    const last = cart[cart.length - 1];
    const heroImage = cartLeftPanel.querySelector('.cart-hero-image');
    if (heroImage) {
        heroImage.src = normalizeAssetPath(last.imgSrc);
        heroImage.alt = '';
    }

    let subtotal = 0;
    const groupedItems = cart.reduce((groups, item, index) => {
        const key = `${item.name}|${item.price}|${item.imgSrc}`;
        const existing = groups.get(key) || {
            ...item,
            indexes: [],
            quantity: 0,
            numericPrice: parseCurrency(item.price),
        };
        existing.indexes.push(index);
        existing.quantity += 1;
        groups.set(key, existing);
        return groups;
    }, new Map());

    const cartItems = Array.from(groupedItems.values());
    cartItems.forEach((item) => {
        subtotal += item.numericPrice * item.quantity;
    });

    cartBody.innerHTML = cartItems.map((item, index) => {
        const lineTotal = item.numericPrice * item.quantity;
        const safeName = escapeHtml(item.name);
        const safeImage = escapeHtml(normalizeAssetPath(item.imgSrc));

        return `
            <div class="cart-item">
                <div class="cart-item-media">
                    <img src="${safeImage}" alt="${safeName}">
                </div>
                <div class="cart-item-info">
                    <p class="cart-item-kicker">Piece ${String(index + 1).padStart(2, '0')}</p>
                    <h4 class="cart-item-name">${safeName}</h4>
                    <button class="cart-item-remove hover-target" data-indexes="${item.indexes.join(',')}">Remove</button>
                </div>
                <div class="cart-item-summary">
                    <div class="cart-item-quantity" aria-label="Change quantity for ${safeName}">
                        <button class="cart-qty-btn cart-qty-decrease hover-target" type="button" data-indexes="${item.indexes.join(',')}" aria-label="Decrease ${safeName} quantity">−</button>
                        <span class="cart-item-qty">${item.quantity}</span>
                        <button class="cart-qty-btn cart-qty-increase hover-target" type="button" data-name="${safeName}" data-price="${formatCurrency(item.price)}" data-img="${safeImage}" aria-label="Increase ${safeName} quantity">+</button>
                    </div>
                    <p class="cart-item-price">${formatCurrency(lineTotal)}</p>
                </div>
            </div>
        `;
    }).join('');

    cartTotal.textContent = formatCurrency(subtotal);

    cartBody.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const indexes = btn.dataset.indexes.split(',').map(Number).sort((a, b) => b - a);
            const current = getCart();
            indexes.forEach((idx) => current.splice(idx, 1));
            saveCart(current);
        });
    });

    cartBody.querySelectorAll('.cart-qty-decrease').forEach(btn => {
        btn.addEventListener('click', () => {
            const indexes = btn.dataset.indexes.split(',').map(Number).sort((a, b) => b - a);
            const current = getCart();
            current.splice(indexes[0], 1);
            saveCart(current);
        });
    });

    cartBody.querySelectorAll('.cart-qty-increase').forEach(btn => {
        btn.addEventListener('click', () => {
            const current = getCart();
            current.push({
                name: btn.dataset.name,
                price: btn.dataset.price,
                imgSrc: btn.dataset.img,
            });
            saveCart(current);
        });
    });
}
