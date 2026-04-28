export function slugifyProductName(value = '') {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'product';
}

export function buildProductSharePath(product = {}) {
    return `/product/${product.id}-${slugifyProductName(product.name)}`;
}

export function getProductIdFromPath(pathname = window.location.pathname) {
    const match = String(pathname).match(/^\/product\/(\d+)(?:-|\/|$)/);
    return match ? Number(match[1]) : null;
}
