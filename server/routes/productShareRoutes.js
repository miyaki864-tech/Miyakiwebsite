const fs = require('fs/promises');
const path = require('path');
const express = require('express');

const { ROOT_DIR } = require('../config');
const { dbGet } = require('../database');
const { buildProductSlug, getProductIdFromSlug } = require('../productLinks');
const { asyncRoute } = require('../utils/http');

const router = express.Router();
const SHOP_HTML_PATH = path.join(ROOT_DIR, 'shop.html');

function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[char]));
}

function stripControlWhitespace(value = '') {
    return String(value).replace(/\s+/g, ' ').trim();
}

function buildOrigin(req) {
    return `${req.protocol}://${req.get('host')}`;
}

function buildAbsoluteUrl(req, pathname) {
    return new URL(pathname, buildOrigin(req)).href;
}

function buildMetaTags(req, product) {
    const canonicalPath = `/product/${buildProductSlug(product)}`;
    const title = `${product.name} | MIYAKI`;
    const description = stripControlWhitespace(product.description)
        || `Explore ${product.name} from the ${product.series || 'MIYAKI'} collection.`;
    const imageUrl = buildAbsoluteUrl(req, `/${String(product.image_url || '').replace(/^\/+/, '')}`);
    const canonicalUrl = buildAbsoluteUrl(req, canonicalPath);

    return `
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
    <meta name="description" content="${escapeHtml(description)}">
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="MIYAKI">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(imageUrl)}">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
    <script>window.MIYAKI_SHARED_PRODUCT_ID=${JSON.stringify(product.id)};</script>`;
}

function injectProductMeta(html, req, product) {
    const title = `${product.name} | MIYAKI`;
    const withBase = html.replace('<head>', '<head>\n    <base href="/">');
    const withoutDefaultDescription = withBase.replace(
        /\s*<meta name="description"[\s\S]*?>/i,
        ''
    );
    const titled = withoutDefaultDescription.replace(
        /<title>[\s\S]*?<\/title>/i,
        `<title>${escapeHtml(title)}</title>`
    );

    return titled.replace('</head>', `${buildMetaTags(req, product)}\n</head>`);
}

router.get('/:slug', asyncRoute(async (req, res) => {
    const productId = getProductIdFromSlug(req.params.slug);
    if (!productId) return res.redirect('/shop.html');

    const product = await dbGet('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) return res.redirect('/shop.html');

    const canonicalSlug = buildProductSlug(product);
    if (req.params.slug !== canonicalSlug) {
        return res.redirect(301, `/product/${canonicalSlug}`);
    }

    const html = await fs.readFile(SHOP_HTML_PATH, 'utf8');
    return res.send(injectProductMeta(html, req, product));
}));

router.get('/', (_req, res) => res.redirect('/shop.html'));

module.exports = router;
