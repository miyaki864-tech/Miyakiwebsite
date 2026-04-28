import { initCart } from './cart.js';
import { initAnimations } from './animations.js';
import { initShop } from './shop.js?v=20260429';
import { initAdmin } from './admin.js?v=20260429';
import { initLogin } from './login.js?v=20260429';
import { initCheckout } from './checkout.js?v=20260429';
import { initArchive } from './archive.js?v=20260429';
import { initMobileNav } from './mobileNav.js';
import { initTracking } from './tracking.js';
import { initKeyboardNavigation } from './keyboardNavigation.js';
import { injectCartShell } from './components/cartShell.js';
import { initArchiveAdminAccess, initShopAdminAccess } from './adminAccess.js?v=20260429';

function getPageKey(pathname) {
    if (pathname.startsWith('/product/')) return 'shop';
    if (pathname.includes('shop.html')) return 'shop';
    if (pathname.includes('admin.html')) return 'admin';
    if (pathname.includes('login.html')) return 'login';
    if (pathname.includes('checkout.html')) return 'checkout';
    if (pathname.includes('archive.html')) return 'archive';
    if (pathname.includes('tracking.html')) return 'tracking';
    if (pathname === '/' || pathname.includes('index.html')) return 'home';
    return 'unknown';
}

document.addEventListener('DOMContentLoaded', () => {
    const pageKey = getPageKey(window.location.pathname);
    const isStorefrontPage = ['home', 'shop', 'archive'].includes(pageKey);

    if (isStorefrontPage) {
        injectCartShell();
        initMobileNav();
    }

    initAnimations();

    if (isStorefrontPage) {
        initCart();
    }

    if (pageKey === 'shop') {
        initShop();
        initShopAdminAccess();
    } else if (pageKey === 'admin') {
        initAdmin();
    } else if (pageKey === 'login') {
        initLogin();
    } else if (pageKey === 'checkout') {
        initCheckout();
    } else if (pageKey === 'archive') {
        initArchive();
        initArchiveAdminAccess();
    } else if (pageKey === 'tracking') {
        initTracking();
    }

    initKeyboardNavigation();
});
