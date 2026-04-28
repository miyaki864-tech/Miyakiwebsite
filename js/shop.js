import { fetchProducts, fetchSeriesMeta } from './api.js?v=20260429';
import { addToCart } from './cart.js';
import { CURRENCY_LABEL } from './currency.js';
import { renderProductGrid } from './components/productCards.js';
import { closeProductPanel, initProductPanel, openProductPanel } from './components/productPanel.js?v=20260429';
import { SlideController } from './ui/slideController.js';
import { escapeHtml, isMobileViewport } from './utils/dom.js';
import { getProductIdFromPath } from './utils/productLinks.js?v=20260429';

let _allProducts = [];
let _seriesList = [];
let _seriesMeta = new Map();
let _activeIndex = 0;
let _filterState = { minPrice: 0, maxPrice: 9999 };
let _priceFloor = 0;
let _priceCeil = 9999;
let _searchQuery = '';
let _slideController = null;
let _mobileSelectionLockUntil = 0;
let _mobileScrollSpyRaf = 0;

function getVisibleProducts({ seriesName = null, query = '' } = {}) {
    const normalizedQuery = String(query).trim().toLowerCase();

    return [..._allProducts]
        .filter((product) => {
            const matchesSeries = !seriesName || (product.series || 'Uncategorized') === seriesName;
            const matchesQuery = !normalizedQuery || [
                product.name,
                product.series || '',
                product.description || '',
                product.tags || '',
                product.contents || '',
                product.size || '',
            ].some((value) => value.toLowerCase().includes(normalizedQuery));
            const matchesPrice = product.price >= _filterState.minPrice && product.price <= _filterState.maxPrice;

            return matchesSeries && matchesQuery && matchesPrice;
        })
        .sort((a, b) => b.price - a.price);
}

function renderShopProductGrid(grid, products, emptyMessage = 'No results') {
    renderProductGrid(grid, products, {
        emptyMessage,
        onAdd: ({ name, price, imgSrc }) => addToCart(name, price, imgSrc),
        onOpen: openProductPanel,
        withPulseFeedback: true,
    });
}

function getSharedProductId() {
    return window.MIYAKI_SHARED_PRODUCT_ID || getProductIdFromPath();
}

function findProductById(productId) {
    return _allProducts.find((product) => Number(product.id) === Number(productId));
}

function getProductSeriesIndex(product) {
    return _seriesList.indexOf(product?.series || 'Uncategorized');
}

function openProductFromRoute(product, { updateUrl = false } = {}) {
    if (!product) return false;

    openProductPanel({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url,
        description: product.description,
        contents: product.contents,
        size: product.size,
        updateUrl,
    });
    return true;
}

function openSharedProductFromLocation() {
    const sharedProduct = findProductById(getSharedProductId());
    if (!sharedProduct) return false;

    const seriesIndex = getProductSeriesIndex(sharedProduct);
    if (seriesIndex >= 0 && seriesIndex !== _activeIndex) {
        _activeIndex = seriesIndex;
        updateSidebarActive();
        _slideController?.syncSlide?.(_activeIndex, 'none');
    }

    return openProductFromRoute(sharedProduct, { updateUrl: false });
}

function handleProductRouteChange() {
    if (!getProductIdFromPath()) {
        closeProductPanel();
        return;
    }

    openSharedProductFromLocation();
}

function clearSearch({ focusInput = false } = {}) {
    const input = document.getElementById('sidebar-search-input');

    _searchQuery = '';
    if (input) {
        input.value = '';
    }

    syncClearBtn();
    hideSearchOverlay();

    if (focusInput) {
        input?.focus();
    }
}

export async function initShop() {
    const shopRoot = document.getElementById('shop-root');
    if (!shopRoot) return;

    shopRoot.innerHTML = '';
    shopRoot.style.cssText = '';

    // Show skeleton loader while data loads
    shopRoot.innerHTML = `
        <div class="shop-skeleton" id="shop-skeleton">
            <div class="skeleton-title"></div>
            <div class="skeleton-grid">
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
            </div>
        </div>
    `;

    _allProducts = await fetchProducts();
    if (_allProducts.length === 0) {
        shopRoot.innerHTML = '<p class="shop-empty-state">No collections found.</p>';
        return;
    }

    const prices = _allProducts.map(p => p.price);
    _priceFloor = Math.floor(Math.min(...prices));
    _priceCeil = Math.ceil(Math.max(...prices));
    _filterState.minPrice = _priceFloor;
    _filterState.maxPrice = _priceCeil;

    const seriesSet = new Set();
    _allProducts.forEach(p => seriesSet.add(p.series || 'Uncategorized'));
    _seriesList = Array.from(seriesSet);
    _activeIndex = 0;

    const sharedProduct = findProductById(getSharedProductId());
    const sharedSeriesIndex = getProductSeriesIndex(sharedProduct);
    if (sharedSeriesIndex >= 0) {
        _activeIndex = sharedSeriesIndex;
    }

    try {
        const metaList = await fetchSeriesMeta();
        metaList.forEach(m => _seriesMeta.set(m.name, m.description));
    } catch (e) {
        console.warn('Could not fetch series descriptions', e);
    }

    shopRoot.innerHTML = '';

    // Build layout
    shopRoot.innerHTML = `
        <aside class="shop-sidebar">
            <div class="sidebar-search-section">
                <div class="sidebar-search-row">
                    <div class="sidebar-search-wrap">
                        <input id="sidebar-search-input" class="sidebar-search-input"
                            type="text" placeholder="Search" autocomplete="off" spellcheck="false">
                        <button class="sidebar-search-clear" id="sidebar-search-clear" aria-label="Clear">&#215;</button>
                    </div>
                    <button class="mobile-series-dropdown-trigger" id="mobile-series-dropdown-trigger" type="button">
                        <span id="mobile-series-trigger-text"></span>
                        <span class="mobile-series-caret">&#8595;</span>
                    </button>
                </div>
                <button class="sidebar-filter-toggle" id="sidebar-filter-toggle">
                    <span class="filter-toggle-label">Filter</span>
                    <span class="filter-toggle-arrow" id="filter-toggle-arrow">&#8595;</span>
                </button>
                <div class="sidebar-filter-panel" id="sidebar-filter-panel">
                    <div class="filter-group">
                        <p class="filter-group-label">Price Range</p>
                        <div class="price-inputs-row">
                            <div class="price-box">
                                <label class="price-box-label" for="price-min-input">Min</label>
                                <div class="price-box-inner">
                                    <span class="price-currency">${CURRENCY_LABEL}</span>
                                    <input type="number" id="price-min-input" class="price-input"
                                        value="${_priceFloor}" min="${_priceFloor}" max="${_priceCeil}" step="1">
                                </div>
                            </div>
                            <div class="price-sep">—</div>
                            <div class="price-box">
                                <label class="price-box-label" for="price-max-input">Max</label>
                                <div class="price-box-inner">
                                    <span class="price-currency">${CURRENCY_LABEL}</span>
                                    <input type="number" id="price-max-input" class="price-input"
                                        value="${_priceCeil}" min="${_priceFloor}" max="${_priceCeil}" step="1">
                                </div>
                            </div>
                        </div>
                        <div class="price-slider-wrap">
                            <div class="price-slider-track">
                                <div class="price-slider-fill" id="price-slider-fill"></div>
                            </div>
                            <input type="range" id="price-slider-min" class="price-slider price-slider--min"
                                min="${_priceFloor}" max="${_priceCeil}" value="${_priceFloor}" step="1">
                            <input type="range" id="price-slider-max" class="price-slider price-slider--max"
                                min="${_priceFloor}" max="${_priceCeil}" value="${_priceCeil}" step="1">
                        </div>
                    </div>
                </div>
            </div>
            <div id="series-links" class="series-links-container"></div>
        </aside>

        <!-- Fullscreen Dropdown Overlay -->
        <div class="mobile-series-dropdown-overlay" id="mobile-series-dropdown-overlay">
            <div class="dropdown-overlay-header">
                <span class="dropdown-overlay-title">COLLECTIONS</span>
                <button class="dropdown-overlay-close" id="dropdown-overlay-close">&#215;</button>
            </div>
            <div class="dropdown-overlay-list" id="dropdown-overlay-list"></div>
        </div>

        <div class="shop-slides-viewport" id="shop-slides-viewport">



            <!-- Resistance progress arc -->
            <div class="scroll-resistance-wrap" id="scroll-resistance-wrap">
                <svg class="resistance-arc" viewBox="0 0 40 40">
                    <circle class="arc-bg" cx="20" cy="20" r="15" fill="none" stroke-width="1.5"/>
                    <circle class="arc-fill" id="arc-fill" cx="20" cy="20" r="15" fill="none" stroke-width="1.5"
                        stroke-dasharray="94.25" stroke-dashoffset="94.25"
                        stroke-linecap="round" transform="rotate(-90 20 20)"/>
                </svg>
                <span class="resistance-direction" id="resistance-direction">↓</span>
            </div>

            <!-- Slides track -->
            <div class="shop-slides-track" id="shop-slides-track"></div>
        </div>
    `;

    renderSidebar();
    renderAllSlides();
    updateSidebarActive();

    const isMobile = isMobileViewport();

    if (!isMobile) {
        _slideController = new SlideController({
            trackId: 'shop-slides-track',
            viewportId: 'shop-slides-viewport',
            resistanceThreshold: 220,
            animationDuration: 1200,
            itemsCount: _seriesList.length,
            initialIndex: _activeIndex,
            onIndexChange: (index) => {
                _activeIndex = index;
                updateSidebarActive();
                const prevBtn = document.getElementById('series-nav-prev');
                const nextBtn = document.getElementById('series-nav-next');
                if (prevBtn) prevBtn.style.opacity = index === 0 ? '0.2' : '1';
                if (nextBtn) nextBtn.style.opacity = index === _seriesList.length - 1 ? '0.2' : '1';
            }
        });
        _slideController.syncSlide(_activeIndex, 'none');

        const prev = document.getElementById('series-nav-prev');
        const next = document.getElementById('series-nav-next');
        if (prev) { prev.addEventListener('click', () => _slideController.goToPrev()); prev.style.opacity = '0.2'; }
        if (next) { next.addEventListener('click', () => _slideController.goToNext()); }
    }

    initProductPanel();
    initSearchFilter();
    initPriceSlider();
    initMobileDropdown();
    openSharedProductFromLocation();
    window.removeEventListener('popstate', handleProductRouteChange);
    window.addEventListener('popstate', handleProductRouteChange);
}

/* ─── Sidebar ─────────────────────────────────────── */
function renderSidebar() {
    const container = document.getElementById('series-links');
    container.innerHTML = '';
    _seriesList.forEach((name, i) => {
        const btn = document.createElement('button');
        btn.className = 'series-link' + (i === _activeIndex ? ' active' : '');
        btn.innerHTML = `
            <span>${name.toUpperCase()}</span>
        `;
        btn.addEventListener('click', () => {
            closeProductPanel();
            if (isMobileViewport() && _searchQuery) {
                clearSearch();
            }
            if (_slideController) {
                _slideController.goToIndex(i);
            } else {
                const tg = document.getElementById(`slide-${i}`);
                if (tg) {
                    // Update active index immediately for snappy feedback
                    _activeIndex = i;
                    updateSidebarActive();
                    tg.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
        container.appendChild(btn);
    });
}

function updateSidebarActive() {
    document.querySelectorAll('.series-link').forEach((btn, i) => {
        btn.classList.toggle('active', i === _activeIndex);
    });

    // Update mobile centered trigger text
    const triggerText = document.getElementById('mobile-series-trigger-text');
    if (triggerText && _seriesList[_activeIndex]) {
        triggerText.textContent = _seriesList[_activeIndex].toUpperCase();
    }
}

function navigateToSeries(index) {
    const target = document.getElementById(`slide-${index}`);
    if (!target) return;

    _activeIndex = index;
    updateSidebarActive();

    if (!isMobileViewport()) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    const topBarHeight = document.querySelector('.mobile-top-bar')?.offsetHeight || 0;
    const toolbarHeight = document.querySelector('.shop-sidebar')?.offsetHeight || 0;
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    const destination = Math.max(0, targetTop - topBarHeight - toolbarHeight + 16);
    _mobileSelectionLockUntil = Date.now() + 1200;

    window.scrollTo({ top: destination, behavior: 'smooth' });
    window.setTimeout(updateActiveSeriesFromScroll, 1300);
}

function updateActiveSeriesFromScroll() {
    if (!isMobileViewport() || Date.now() < _mobileSelectionLockUntil) return;

    const slides = Array.from(document.querySelectorAll('.series-slide'));
    if (slides.length === 0) return;

    const topBarHeight = document.querySelector('.mobile-top-bar')?.offsetHeight || 0;
    const toolbarHeight = document.querySelector('.shop-sidebar')?.offsetHeight || 0;
    const referenceY = topBarHeight + toolbarHeight + 24;

    let activeIndex = _activeIndex;
    let closestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide) => {
        const rect = slide.getBoundingClientRect();
        const index = parseInt(slide.getAttribute('data-series-index'), 10);

        if (rect.top <= referenceY && rect.bottom > referenceY) {
            activeIndex = index;
            closestDistance = 0;
            return;
        }

        const distance = Math.abs(rect.top - referenceY);
        if (distance < closestDistance) {
            closestDistance = distance;
            activeIndex = index;
        }
    });

    if (_activeIndex !== activeIndex) {
        _activeIndex = activeIndex;
        updateSidebarActive();
    }
}

function scheduleMobileSeriesSync() {
    if (_mobileScrollSpyRaf) return;

    _mobileScrollSpyRaf = window.requestAnimationFrame(() => {
        _mobileScrollSpyRaf = 0;
        updateActiveSeriesFromScroll();
    });
}

/* ─── Mobile Dropdown Overlay ────────────────────── */
function initMobileDropdown() {
    const isMobile = isMobileViewport();
    if (!isMobile) return;

    const trigger = document.getElementById('mobile-series-dropdown-trigger');
    const overlay = document.getElementById('mobile-series-dropdown-overlay');
    const closeBtn = document.getElementById('dropdown-overlay-close');
    const listEl = document.getElementById('dropdown-overlay-list');

    if (!trigger || !overlay) return;

    // populate list
    listEl.innerHTML = '';
    _seriesList.forEach((name, i) => {
        const desc = _seriesMeta.get(name) || '';
        const item = document.createElement('button');
        item.className = 'dropdown-series-item';
        item.innerHTML = `
            <span class="dsi-name">${name.toUpperCase()}</span>
            ${desc ? `<span class="dsi-desc">${escapeHtml(desc)}</span>` : ''}
        `;
        item.addEventListener('click', () => {
            overlay.classList.remove('active');
            document.body.style.overflow = '';

            closeProductPanel();
            if (_searchQuery) clearSearch();
            navigateToSeries(i);
        });

        listEl.appendChild(item);
    });

    trigger.addEventListener('click', () => {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    });
}

/* ─── Slides ──────────────────────────────────────── */
function renderAllSlides() {
    const track = document.getElementById('shop-slides-track');
    track.innerHTML = '';

    const isMobile = isMobileViewport();

    _seriesList.forEach((seriesName, i) => {
        const slide = document.createElement('div');
        slide.className = 'series-slide';
        slide.id = `slide-${i}`;
        slide.setAttribute('data-series-index', i);

        slide.innerHTML = `
            <div class="series-slide-inner">
                <div class="bento-container" id="bento-grid-${i}"></div>
            </div>
        `;
        track.appendChild(slide);
        renderBentoGridForSlide(i);
    });

    if (isMobile) {
        window.removeEventListener('scroll', scheduleMobileSeriesSync);
        window.addEventListener('scroll', scheduleMobileSeriesSync, { passive: true });
    }
}

function renderBentoGridForSlide(index) {
    const seriesName = _seriesList[index];
    const grid = document.getElementById(`bento-grid-${index}`);
    if (!grid) return;

    const pool = getVisibleProducts({ seriesName });
    renderShopProductGrid(grid, pool);
}



/* ─── Search wiring ────────────────────────────────── */
function initSearchFilter() {
    const input = document.getElementById('sidebar-search-input');
    const clearBtn = document.getElementById('sidebar-search-clear');
    const toggle = document.getElementById('sidebar-filter-toggle');
    const panel = document.getElementById('sidebar-filter-panel');
    const arrow = document.getElementById('filter-toggle-arrow');

    if (input) {
        input.addEventListener('input', () => {
            _searchQuery = input.value.trim();
            syncClearBtn();
            if (_searchQuery) renderSearchOverlay(_searchQuery);
            else hideSearchOverlay();
        });
        input.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                clearSearch();
            }
        });
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearSearch({ focusInput: true });
        });
    }
    if (toggle && panel) {
        toggle.addEventListener('click', () => {
            const open = panel.classList.toggle('open');
            toggle.classList.toggle('open', open);
            arrow.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    }

    syncClearBtn();
}

function syncClearBtn() {
    const input = document.getElementById('sidebar-search-input');
    const clearBtn = document.getElementById('sidebar-search-clear');
    if (!input || !clearBtn) return;
    const has = input.value.length > 0;
    clearBtn.style.opacity = has ? '1' : '0';
    clearBtn.style.pointerEvents = has ? 'auto' : 'none';
}

// Search uses a floating overlay on top of the current slide
function renderSearchOverlay(query) {
    let overlay = document.getElementById('search-overlay-slide');
    const viewport = document.getElementById('shop-slides-viewport');
    const isMobile = isMobileViewport();

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'search-overlay-slide';
        overlay.className = 'search-overlay-slide';
        viewport.appendChild(overlay);
    }

    const pool = getVisibleProducts({ query });

    overlay.innerHTML = `
        <div class="series-slide-inner ${isMobile ? 'search-results-mobile' : ''}">
            <div class="bento-container" id="bento-grid-search"></div>
        </div>
    `;
    overlay.style.display = 'flex';
    viewport?.classList.add('search-active');

    const grid = document.getElementById('bento-grid-search');
    renderShopProductGrid(grid, pool, 'No matching pieces');
}

function hideSearchOverlay() {
    const overlay = document.getElementById('search-overlay-slide');
    if (overlay) overlay.style.display = 'none';
    document.getElementById('shop-slides-viewport')?.classList.remove('search-active');
}

/* ─── Price slider ─────────────────────────────────── */
function initPriceSlider() {
    const sliderMin = document.getElementById('price-slider-min');
    const sliderMax = document.getElementById('price-slider-max');
    const inputMin = document.getElementById('price-min-input');
    const inputMax = document.getElementById('price-max-input');
    const fill = document.getElementById('price-slider-fill');
    if (!sliderMin || !sliderMax || !inputMin || !inputMax || !fill) return;

    const range = _priceCeil - _priceFloor;

    function updateFill() {
        const lo = parseFloat(sliderMin.value);
        const hi = parseFloat(sliderMax.value);
        fill.style.left = ((lo - _priceFloor) / range * 100) + '%';
        fill.style.width = (((hi - lo) / range) * 100) + '%';
    }

    function refreshGrids() {
        _seriesList.forEach((_, i) => renderBentoGridForSlide(i));
        if (_searchQuery) renderSearchOverlay(_searchQuery);
    }

    sliderMin.addEventListener('input', () => {
        let lo = parseFloat(sliderMin.value), hi = parseFloat(sliderMax.value);
        if (lo > hi - 1) { lo = hi - 1; sliderMin.value = lo; }
        inputMin.value = lo; _filterState.minPrice = lo; updateFill(); refreshGrids();
    });
    sliderMax.addEventListener('input', () => {
        let lo = parseFloat(sliderMin.value), hi = parseFloat(sliderMax.value);
        if (hi < lo + 1) { hi = lo + 1; sliderMax.value = hi; }
        inputMax.value = hi; _filterState.maxPrice = hi; updateFill(); refreshGrids();
    });
    inputMin.addEventListener('change', () => {
        let lo = Math.max(_priceFloor, Math.min(parseFloat(inputMin.value) || _priceFloor, _priceCeil));
        let hi = parseFloat(sliderMax.value);
        if (lo > hi - 1) lo = hi - 1;
        inputMin.value = lo; sliderMin.value = lo; _filterState.minPrice = lo; updateFill(); refreshGrids();
    });
    inputMax.addEventListener('change', () => {
        let lo = parseFloat(sliderMin.value);
        let hi = Math.max(_priceFloor, Math.min(parseFloat(inputMax.value) || _priceCeil, _priceCeil));
        if (hi < lo + 1) hi = lo + 1;
        inputMax.value = hi; sliderMax.value = hi; _filterState.maxPrice = hi; updateFill(); refreshGrids();
    });
    updateFill();
}
