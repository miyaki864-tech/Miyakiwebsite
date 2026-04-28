const express = require('express');
const { DEFAULT_PRODUCT_IMAGE } = require('../config');
const { dbAll, dbRun } = require('../database');
const { requireAdminApi } = require('../middleware/auth');
const { buildProductResponse } = require('../payloads');
const { toPublicUploadPath, uploadProductImage } = require('../uploads');
const { asyncRoute, withImageUpload } = require('../utils/http');

const router = express.Router();

router.get('/', asyncRoute(async (_req, res) => {
    const rows = await dbAll('SELECT * FROM products');
    return res.json({ message: 'success', data: rows });
}));

router.post('/', requireAdminApi, withImageUpload(uploadProductImage, async (req, res) => {
    const imageUrl = req.file ? toPublicUploadPath(req.file.filename) : DEFAULT_PRODUCT_IMAGE;
    const params = [
        req.body.productName,
        parseFloat(req.body.productPrice),
        req.body.productSeries,
        imageUrl,
        req.body.productTags || '',
        req.body.productDescription || '',
        req.body.productContents || '',
        req.body.productSize || '',
    ];

    const result = await dbRun(
        'INSERT INTO products (name, price, series, image_url, tags, description, contents, size) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        params
    );

    return res.json({
        message: 'success',
        data: buildProductResponse(result.lastID, req.body, imageUrl),
    });
}));

router.put('/:id', requireAdminApi, withImageUpload(uploadProductImage, async (req, res) => {
    const imageUrl = req.file ? toPublicUploadPath(req.file.filename) : req.body.existingImage;
    const params = [
        req.body.productName,
        parseFloat(req.body.productPrice),
        req.body.productSeries,
        imageUrl,
        req.body.productTags || '',
        req.body.productDescription || '',
        req.body.productContents || '',
        req.body.productSize || '',
        req.params.id,
    ];

    const result = await dbRun(
        'UPDATE products SET name = ?, price = ?, series = ?, image_url = ?, tags = ?, description = ?, contents = ?, size = ? WHERE id = ?',
        params
    );

    if (result.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({
        message: 'success',
        data: buildProductResponse(req.params.id, req.body, imageUrl),
    });
}));

router.delete('/:id', requireAdminApi, asyncRoute(async (req, res) => {
    const result = await dbRun('DELETE FROM products WHERE id = ?', [req.params.id]);
    return res.json({ message: 'success', changes: result.changes });
}));

module.exports = router;
