import { formatCurrency } from '../currency.js';
import { escapeHtml, normalizeAssetPath } from '../utils/dom.js?v=20260429-images';

export function getBentoClass(index) {
    const mod = index % 7;
    if (mod === 0) return 'bento-hero';
    if (mod === 3) return 'bento-wide';
    if (mod === 4) return 'bento-tall';
    return '';
}

export function buildProductCard(product, options = {}) {
    const {
        isHero = false,
        bentoClass = '',
    } = options;

    const item = document.createElement('div');
    const classes = ['bento-item'];
    if (isHero) classes.push('bento-hero');
    if (bentoClass && !isHero) classes.push(bentoClass);
    item.className = classes.join(' ');

    item.dataset.id = product.id;
    item.dataset.name = product.name;
    item.dataset.price = product.price;
    item.dataset.image = normalizeAssetPath(product.image_url);
    item.dataset.series = product.series || 'Uncategorized';
    item.dataset.description = product.description || '';
    item.dataset.contents = product.contents || '';
    item.dataset.size = product.size || '';

    const safeName = escapeHtml(product.name);
    const safeImage = escapeHtml(normalizeAssetPath(product.image_url));
    const displayPrice = formatCurrency(product.price);

    item.innerHTML = `
        <div class="bento-img-wrap">
            <img src="${safeImage}" alt="${safeName}" loading="lazy">
        </div>
        <div class="bento-info">
            <div>
                <h3 class="product-name">${safeName}</h3>
                <p class="product-price">${displayPrice}</p>
            </div>
            <button class="bento-add quick-add-bento"
                data-name="${safeName}"
                data-price="${displayPrice}"
                data-img="${safeImage}">Add</button>
        </div>
    `;

    const img = item.querySelector('img');
    const wrap = item.querySelector('.bento-img-wrap');
    if (img.complete) {
        img.classList.add('img-loaded');
        wrap.classList.add('loaded');
    } else {
        img.addEventListener('load', () => {
            img.classList.add('img-loaded');
            wrap.classList.add('loaded');
        });
    }

    return item;
}

export function renderGridEmptyState(grid, message = 'No results') {
    grid.innerHTML = `
        <div class="product-grid-empty">
            <p class="product-grid-empty-text">${escapeHtml(message)}</p>
        </div>
    `;
}

export function attachProductGridInteractions(grid, options = {}) {
    const {
        onAdd,
        onOpen,
        withPulseFeedback = false,
    } = options;

    grid.querySelectorAll('.quick-add-bento').forEach((btn) => {
        btn.addEventListener('click', (event) => {
            event.stopPropagation();
            onAdd?.({
                name: btn.dataset.name,
                price: btn.dataset.price,
                imgSrc: btn.dataset.img,
            });

            if (!withPulseFeedback) return;

            btn.classList.add('added');
            const previousLabel = btn.textContent;
            btn.textContent = '✓';
            setTimeout(() => {
                btn.classList.remove('added');
                btn.textContent = previousLabel;
            }, 1400);
        });
    });

    grid.querySelectorAll('.bento-item').forEach((card) => {
        card.addEventListener('click', (event) => {
            if (event.target.closest('.quick-add-bento')) return;
            onOpen?.({
                id: card.dataset.id,
                name: card.dataset.name,
                price: parseFloat(card.dataset.price),
                image: card.dataset.image,
                series: card.dataset.series,
                description: card.dataset.description,
                contents: card.dataset.contents,
                size: card.dataset.size,
            });
        });
    });
}

export function renderProductGrid(grid, products, options = {}) {
    const {
        emptyMessage = 'No results',
        onAdd,
        onOpen,
        withPulseFeedback = false,
    } = options;

    grid.innerHTML = '';

    if (products.length === 0) {
        renderGridEmptyState(grid, emptyMessage);
        return;
    }

    products.forEach((product, index) => {
        const bentoClass = getBentoClass(index);
        grid.appendChild(buildProductCard(product, {
            isHero: bentoClass === 'bento-hero',
            bentoClass,
        }));
    });

    attachProductGridInteractions(grid, {
        onAdd,
        onOpen,
        withPulseFeedback,
    });
}
