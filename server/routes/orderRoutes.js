const express = require('express');
const { dbAll, dbRun } = require('../database');
const { requireAdminApi } = require('../middleware/auth');
const { buildOrderPayload } = require('../payloads');
const { asyncRoute } = require('../utils/http');

const router = express.Router();

router.post('/', asyncRoute(async (req, res) => {
    const order = buildOrderPayload(req.body);

    if (!order) {
        return res.status(400).json({ error: 'Incomplete order details.' });
    }

    const orderInsert = await dbRun(
        `INSERT INTO orders (customer_name, customer_email, shipping_address, phone, total_amount)
         VALUES (?, ?, ?, ?, ?)`,
        [order.customerName, order.customerEmail, order.shippingAddress, order.phone, order.total]
    );

    await Promise.all(order.items.map((item) => (
        dbRun(
            'INSERT INTO order_items (order_id, product_name, price, quantity) VALUES (?, ?, ?, ?)',
            [orderInsert.lastID, item.name, item.price, item.quantity]
        )
    )));

    return res.json({ message: 'success', orderId: orderInsert.lastID });
}));

router.get('/', requireAdminApi, asyncRoute(async (_req, res) => {
    const [orders, orderItems] = await Promise.all([
        dbAll('SELECT * FROM orders ORDER BY created_at DESC'),
        dbAll('SELECT * FROM order_items'),
    ]);

    const itemsByOrder = orderItems.reduce((acc, item) => {
        if (!acc[item.order_id]) acc[item.order_id] = [];
        acc[item.order_id].push(item);
        return acc;
    }, {});

    const ordersWithItems = orders.map((order) => ({
        ...order,
        items: itemsByOrder[order.id] || [],
    }));

    return res.json({ message: 'success', data: ordersWithItems });
}));

router.put('/:id/status', requireAdminApi, asyncRoute(async (req, res) => {
    const result = await dbRun(
        'UPDATE orders SET status = ? WHERE id = ?',
        [req.body.status, req.params.id]
    );

    return res.json({ message: 'success', changes: result.changes });
}));

module.exports = router;
