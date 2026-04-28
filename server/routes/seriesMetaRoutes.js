const express = require('express');
const { dbAll, dbRun } = require('../database');
const { requireAdminApi } = require('../middleware/auth');
const { asyncRoute } = require('../utils/http');

const router = express.Router();

router.get('/', asyncRoute(async (_req, res) => {
    const result = await dbAll('SELECT * FROM series_meta');
    return res.json(result);
}));

router.put('/', requireAdminApi, asyncRoute(async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing series name' });

    await dbRun(`
        INSERT INTO series_meta (name, description)
        VALUES (?, ?)
        ON CONFLICT(name) DO UPDATE SET description=excluded.description
    `, [name, description]);

    return res.json({ message: 'success' });
}));

module.exports = router;
