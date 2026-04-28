function slugifyProductName(value = '') {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'product';
}

function buildProductSlug(product = {}) {
    return `${product.id}-${slugifyProductName(product.name)}`;
}

function getProductIdFromSlug(slug = '') {
    const match = String(slug).match(/^(\d+)(?:-|$)/);
    return match ? Number(match[1]) : null;
}

module.exports = {
    buildProductSlug,
    getProductIdFromSlug,
    slugifyProductName,
};
