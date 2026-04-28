import { closeCart, openCart } from './cart.js';

const NAV_ROOT_SELECTOR = '.navbar, .mobile-top-bar, .mobile-tab-bar, .dashboard-nav';
const NAV_ITEM_SELECTOR = 'a[href], button:not([disabled]), [role="button"]:not([aria-disabled="true"])';

function isTypingTarget(target) {
    if (!(target instanceof Element)) return false;
    const tagName = target.tagName.toLowerCase();
    return tagName === 'input'
        || tagName === 'textarea'
        || tagName === 'select'
        || target.isContentEditable;
}

function isSpaceKey(event) {
    return event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space';
}

function getVisibleNavItems(root) {
    return Array.from(root.querySelectorAll(NAV_ITEM_SELECTOR)).filter((item) => {
        const disabled = item.hasAttribute('disabled') || item.getAttribute('aria-disabled') === 'true';
        return !disabled && item.getClientRects().length > 0;
    });
}

function moveFocus(event, root) {
    const items = getVisibleNavItems(root);
    const current = event.target.closest(NAV_ITEM_SELECTOR);
    const currentIndex = items.indexOf(current);
    if (!items.length || currentIndex === -1) return;

    event.preventDefault();

    if (event.key === 'Home') {
        items[0].focus();
        return;
    }

    if (event.key === 'End') {
        items[items.length - 1].focus();
        return;
    }

    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (currentIndex + direction + items.length) % items.length;
    items[nextIndex].focus();
}

function closeOpenSurfaces() {
    const productPanelWasOpen = document.body.classList.contains('panel-open');

    closeCart();

    const collectionDropdown = document.getElementById('mobile-series-dropdown-overlay');
    collectionDropdown?.classList.remove('active');

    const articleModal = document.getElementById('article-modal');
    const articleOverlay = document.getElementById('article-modal-overlay');
    articleModal?.classList.remove('active');
    articleOverlay?.classList.remove('active');

    const paymentModal = document.getElementById('payment-modal');
    paymentModal?.classList.remove('active');

    const adminDeleteModal = document.getElementById('delete-modal');
    adminDeleteModal?.classList.remove('active');

    const konamiOverlay = document.getElementById('konami-overlay');
    konamiOverlay?.classList.remove('is-active');

    document.body.style.overflow = productPanelWasOpen ? 'hidden' : '';
}

function activateCustomControl(event) {
    const mobileCartTrigger = event.target.closest('#mobile-top-cart-btn');
    if (mobileCartTrigger && (event.key === 'Enter' || isSpaceKey(event))) {
        event.preventDefault();
        openCart(event);
        return true;
    }

    const roleButton = event.target.closest('[role="button"]');
    if (roleButton && isSpaceKey(event)) {
        event.preventDefault();
        roleButton.click();
        return true;
    }

    return false;
}

export function initKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
        if (isTypingTarget(event.target)) return;

        if (event.key === 'Escape') {
            closeOpenSurfaces();
            return;
        }

        if (activateCustomControl(event)) return;

        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
            return;
        }

        const navRoot = event.target.closest(NAV_ROOT_SELECTOR);
        if (!navRoot) return;

        event.stopPropagation();
        moveFocus(event, navRoot);
    }, { capture: true });
}
