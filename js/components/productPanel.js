import { addToCart } from '../cart.js';
import { formatCurrency } from '../currency.js';
import { buildProductSharePath } from '../utils/productLinks.js';
import { isMobileViewport, normalizeAssetPath } from '../utils/dom.js';

const DEFAULT_DESCRIPTION = 'A meticulously crafted piece from the Miyaki studio - where Japanese wabi-sabi philosophy meets contemporary form. Each piece is individually hand-thrown and fired, ensuring no two are identical.';
const DIMENSIONS_FALLBACK = 'Dimensions not specified yet.';
const ITEMS_FALLBACK = 'Items included not specified yet.';

export function closeProductPanel() {
    const panel = document.getElementById('product-detail-panel');
    const overlay = document.getElementById('product-panel-overlay');

    document.documentElement.classList.remove('panel-open');
    document.body.classList.remove('panel-open');
    panel?.classList.remove('active');
    overlay?.classList.remove('active');

    const hasProductQuery = new URLSearchParams(window.location.search).has('product');
    if (window.location.pathname.startsWith('/product/') || hasProductQuery) {
        const firstPathSegment = window.location.hostname.endsWith('github.io')
            ? window.location.pathname.split('/').filter(Boolean)[0]
            : '';
        const shopPath = firstPathSegment ? `/${firstPathSegment}/shop.html` : '/shop.html';
        window.history.pushState({}, '', shopPath);
    }
}

function applyMobileProductFrame(panel, overlay) {
    if (!isMobileViewport()) {
        panel.style.cssText = '';
        if (overlay) overlay.style.cssText = '';
        return;
    }

    const topOffset = '56px';
    const bottomOffset = '68px';
    Object.assign(panel.style, {
        position: 'fixed',
        top: topOffset,
        right: '0',
        bottom: bottomOffset,
        left: '0',
        width: '100vw',
        height: 'auto',
        zIndex: '1201',
        borderRadius: '0',
        transform: 'none',
    });

    if (overlay) {
        Object.assign(overlay.style, {
            position: 'fixed',
            top: topOffset,
            right: '0',
            bottom: bottomOffset,
            left: '0',
            zIndex: '1100',
        });
    }
}

export function initProductPanel() {
    const overlay = document.getElementById('product-panel-overlay');
    const panel = document.getElementById('product-detail-panel');
    const closeBtn = document.getElementById('product-panel-close');
    const addBtn = document.getElementById('panel-add-to-cart');
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    const qtyValue = document.getElementById('qty-value');

    if (!panel) return;

    const viewport = document.getElementById('shop-slides-viewport');
    if (viewport && !isMobileViewport()) {
        if (overlay && overlay.parentElement !== viewport) viewport.appendChild(overlay);
        if (panel.parentElement !== viewport) viewport.appendChild(panel);
    } else {
        if (overlay && overlay.parentElement !== document.body) document.body.appendChild(overlay);
        if (panel.parentElement !== document.body) document.body.appendChild(panel);
    }

    closeBtn?.addEventListener('click', closeProductPanel);
    overlay?.addEventListener('click', closeProductPanel);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeProductPanel();
    });

    initPanelDragToDismiss(panel);
    initPanelSidebarDismiss();
    initPanelQuantityControls({ qtyMinus, qtyPlus, qtyValue });
    initPanelAddToCart(addBtn);
}

function initPanelDragToDismiss(panel) {
    let dragStartY = null;
    let currentDrag = 0;

    panel.addEventListener('touchstart', (event) => {
        if (!isMobileViewport()) return;

        const touchY = event.touches[0].clientY;
        const panelTop = panel.getBoundingClientRect().top;
        if (touchY - panelTop > 60) return;

        dragStartY = touchY;
        panel.style.transition = 'none';
    }, { passive: true });

    panel.addEventListener('touchmove', (event) => {
        if (dragStartY === null) return;
        currentDrag = Math.max(0, event.touches[0].clientY - dragStartY);
        panel.style.transform = `translateY(${currentDrag}px)`;
    }, { passive: true });

    panel.addEventListener('touchend', () => {
        if (dragStartY === null) return;

        panel.style.transition = 'transform 0.4s cubic-bezier(0.3, 1.1, 0.2, 1)';
        if (currentDrag > 80) {
            closeProductPanel();
        } else {
            panel.style.transform = '';
        }

        dragStartY = null;
        currentDrag = 0;
    });
}

function initPanelSidebarDismiss() {
    const sidebarSearch = document.getElementById('sidebar-search-input');
    const filterToggle = document.getElementById('sidebar-filter-toggle');
    const priceInputs = document.querySelectorAll('.price-input');

    sidebarSearch?.addEventListener('focus', closeProductPanel);
    filterToggle?.addEventListener('click', closeProductPanel);
    priceInputs.forEach((input) => input.addEventListener('focus', closeProductPanel));
}

function initPanelQuantityControls({ qtyMinus, qtyPlus, qtyValue }) {
    if (!qtyMinus || !qtyPlus || !qtyValue) return;

    qtyMinus.addEventListener('click', () => {
        const value = parseInt(qtyValue.textContent, 10);
        if (value > 1) qtyValue.textContent = value - 1;
    });

    qtyPlus.addEventListener('click', () => {
        const value = parseInt(qtyValue.textContent, 10);
        if (value < 99) qtyValue.textContent = value + 1;
    });
}

function initPanelAddToCart(addBtn) {
    addBtn?.addEventListener('click', () => {
        const qty = parseInt(document.getElementById('qty-value')?.textContent, 10) || 1;
        const name = document.getElementById('panel-product-name')?.textContent || '';
        const price = document.getElementById('panel-product-price')?.textContent || '';
        const src = document.getElementById('panel-product-image')?.src || '';

        for (let i = 0; i < qty; i += 1) {
            addToCart(name, price, src);
        }
        closeProductPanel();
    });
}

export function openProductPanel({
    id,
    name,
    price,
    image,
    description,
    contents,
    size,
    updateUrl = true,
}) {
    const overlay = document.getElementById('product-panel-overlay');
    const panel = document.getElementById('product-detail-panel');
    const qtyValue = document.getElementById('qty-value');
    const sizeSection = document.getElementById('panel-size-section');
    const sizeCopy = document.getElementById('panel-product-size');
    const contentsSection = document.getElementById('panel-content-section');
    const contentsCopy = document.getElementById('panel-product-contents');

    if (!panel) return;
    if (qtyValue) qtyValue.textContent = '1';

    if (updateUrl && id) {
        const sharePath = buildProductSharePath({ id, name });
        if (window.location.pathname !== sharePath) {
            window.history.pushState({ productId: id }, '', sharePath);
        }
    }

    panel.scrollTop = 0;
    const infoCol = panel.querySelector('.product-panel-info-col');
    if (infoCol) infoCol.scrollTop = 0;

    document.documentElement.classList.add('panel-open');
    document.body.classList.add('panel-open');

    const imgEl = document.getElementById('panel-product-image');
    if (imgEl) {
        imgEl.src = normalizeAssetPath(image);
        imgEl.alt = name;
    }
    
    const nameEl = document.getElementById('panel-product-name');
    if (nameEl) nameEl.textContent = name;
    
    const priceEl = document.getElementById('panel-product-price');
    if (priceEl) priceEl.textContent = formatCurrency(price);
    
    const descEl = document.getElementById('panel-product-description');
    if (descEl) descEl.textContent = description || DEFAULT_DESCRIPTION;

    const normalizedSize = String(size || '').trim();
    if (sizeSection && sizeCopy) {
        sizeCopy.textContent = normalizedSize || DIMENSIONS_FALLBACK;
        sizeCopy.classList.toggle('is-empty', normalizedSize.length === 0);
        sizeSection.hidden = false;
    }

    const normalizedContents = String(contents || '').trim();
    if (contentsSection && contentsCopy) {
        contentsCopy.textContent = normalizedContents || ITEMS_FALLBACK;
        contentsCopy.classList.toggle('is-empty', normalizedContents.length === 0);
        contentsSection.hidden = false;
    }

    applyMobileProductFrame(panel, overlay);
    panel.classList.add('active');
    if (isMobileViewport()) {
        overlay?.classList.add('active');
    } else {
        overlay?.classList.remove('active');
    }
}
