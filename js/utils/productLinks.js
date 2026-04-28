export function slugifyProductName(value = '') {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'product';
}

export function buildProductSharePath(product = {}) {
    const slug = `${product.id}-${slugifyProductName(product.name)}`;

    if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
        const firstPathSegment = window.location.pathname.split('/').filter(Boolean)[0];
        const projectBase = firstPathSegment ? `/${firstPathSegment}` : '';
        return `${projectBase}/shop.html?product=${slug}`;
    }

    return `/product/${product.id}-${slugifyProductName(product.name)}`;
}

export function getProductIdFromPath(pathname = window.location.pathname, search = window.location.search) {
    const productParam = new URLSearchParams(search).get('product');
    const queryMatch = String(productParam || '').match(/^(\d+)(?:-|$)/);
    if (queryMatch) return Number(queryMatch[1]);

    const match = String(pathname).match(/^\/product\/(\d+)(?:-|\/|$)/);
    return match ? Number(match[1]) : null;
}
