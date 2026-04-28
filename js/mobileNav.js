import { openCart } from './cart.js';

export function initMobileNav() {
    if (window.innerWidth >= 768) return;

    // Check if already injected
    if (document.querySelector('.mobile-top-bar')) return;

    const topBar = document.createElement('div');
    topBar.className = 'mobile-top-bar';
    topBar.setAttribute('role', 'navigation');
    topBar.setAttribute('aria-label', 'Mobile home navigation');
    topBar.innerHTML = `
        <a href="index.html" class="logo-wrapper" id="mobile-logo">MIYAKI</a>
        <button type="button" class="top-cart-trigger" id="mobile-top-cart-btn" aria-label="Open cart">
            <svg class="top-cart-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M7.5 8.5H16.5L17.25 20H6.75L7.5 8.5Z"></path>
                <path d="M9.25 8.5V6.75C9.25 5.23 10.48 4 12 4C13.52 4 14.75 5.23 14.75 6.75V8.5"></path>
            </svg>
            <span class="tab-badge top-cart-badge" id="mobile-tab-badge">0</span>
        </button>
    `;

    const bottomBar = document.createElement('div');
    bottomBar.className = 'mobile-tab-bar';
    bottomBar.setAttribute('role', 'navigation');
    bottomBar.setAttribute('aria-label', 'Mobile primary navigation');
    
    // Determine active tab
    const path = window.location.pathname;
    const isShop = path.includes('shop.html');
    const isArchive = path.includes('archive.html');
    const isCheckout = path.includes('checkout.html');

    bottomBar.innerHTML = `
        <a href="shop.html" class="mobile-tab ${isShop ? 'active' : ''}" ${isShop ? 'aria-current="page"' : ''}>SHOP</a>
        <a href="archive.html" class="mobile-tab ${isArchive ? 'active' : ''}" ${isArchive ? 'aria-current="page"' : ''}>ARCHIVE</a>
        <a href="checkout.html" class="mobile-tab ${isCheckout ? 'active' : ''}" ${isCheckout ? 'aria-current="page"' : ''}>CHECKOUT</a>
    `;

    document.body.prepend(topBar);
    document.body.append(bottomBar);

    // Quadruple tap admin login
    const logo = document.getElementById('mobile-logo');
    let tapCount = 0;
    let tapResetTimeout;
    
    logo.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent native link click briefly to handle taps
        tapCount++;
        clearTimeout(tapResetTimeout);

        if (tapCount >= 4) {
            window.location.href = 'login.html';
            return;
        }

        tapResetTimeout = setTimeout(() => {
            if (tapCount === 1) {
                // Was a single tap, let's navigate
                window.location.href = 'index.html';
            }
            tapCount = 0;
        }, 350);
    });

    const topCart = document.getElementById('mobile-top-cart-btn');
    topCart?.addEventListener('click', (event) => {
        openCart(event);
    });

    // Initial badge render trigger
    setTimeout(() => window.dispatchEvent(new Event('cartUpdated')), 100);
}
