const express = require('express');
const {
    ADMIN_EVENTS_SQL,
    PUBLIC_EVENTS_SQL,
    dbAll,
    dbGet,
    dbRun,
} = require('../database');
const { requireAdminApi } = require('../middleware/auth');
const { sanitizeEventPayload } = require('../payloads');
const { asyncRoute } = require('../utils/http');

const router = express.Router();

router.get('/', asyncRoute(async (_req, res) => {
    const rows = await dbAll(PUBLIC_EVENTS_SQL);
    return res.json({ message: 'success', data: rows });
}));

router.get('/all', requireAdminApi, asyncRoute(async (_req, res) => {
    const rows = await dbAll(ADMIN_EVENTS_SQL);
    return res.json({ message: 'success', data: rows });
}));

router.post('/', requireAdminApi, asyncRoute(async (req, res) => {
    const event = sanitizeEventPayload(req.body);
    const params = [
        event.title,
        event.subtitle,
        event.city,
        event.country,
        event.venue,
        event.date_start,
        event.date_end,
        event.time,
        event.description,
        event.capacity,
        event.status,
    ];

    const result = await dbRun(
        `INSERT INTO events (title, subtitle, city, country, venue, date_start, date_end, time, description, capacity, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params
    );

    return res.json({ message: 'success', data: { id: result.lastID, ...event } });
}));

router.put('/:id', requireAdminApi, asyncRoute(async (req, res) => {
    const event = sanitizeEventPayload(req.body);
    const params = [
        event.title,
        event.subtitle,
        event.city,
        event.country,
        event.venue,
        event.date_start,
        event.date_end,
        event.time,
        event.description,
        event.capacity,
        event.status,
        req.params.id,
    ];

    const result = await dbRun(
        `UPDATE events
         SET title = ?, subtitle = ?, city = ?, country = ?, venue = ?, date_start = ?, date_end = ?, time = ?, description = ?, capacity = ?, status = ?
         WHERE id = ?`,
        params
    );

    if (result.changes === 0) {
        return res.status(404).json({ error: 'Event not found' });
    }

    return res.json({ message: 'success' });
}));

router.delete('/:id', requireAdminApi, asyncRoute(async (req, res) => {
    await dbRun('DELETE FROM event_bookings WHERE event_id = ?', [req.params.id]);
    const result = await dbRun('DELETE FROM events WHERE id = ?', [req.params.id]);
    return res.json({ message: 'success', changes: result.changes });
}));

router.post('/:id/book', asyncRoute(async (req, res) => {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim();
    const guestCount = Math.max(1, Number.parseInt(req.body.guests, 10) || 1);
    const message = String(req.body.message || '').trim();

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required.' });
    }

    const row = await dbGet(
        `SELECT e.capacity, COUNT(b.id) AS booked
         FROM events e
         LEFT JOIN event_bookings b ON b.event_id = e.id
         WHERE e.id = ?
         GROUP BY e.id`,
        [req.params.id]
    );

    if (!row) {
        return res.status(404).json({ error: 'Event not found' });
    }

    if (row.capacity > 0 && row.booked + guestCount > row.capacity) {
        return res.status(400).json({ error: 'Insufficient capacity' });
    }

    const result = await dbRun(
        'INSERT INTO event_bookings (event_id, name, email, guests, message) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, name, email, guestCount, message]
    );

    return res.json({ message: 'success', bookingId: result.lastID });
}));

router.get('/:id/bookings', requireAdminApi, asyncRoute(async (req, res) => {
    const rows = await dbAll(
        'SELECT * FROM event_bookings WHERE event_id = ? ORDER BY created_at DESC',
        [req.params.id]
    );

    return res.json({ message: 'success', data: rows });
}));

module.exports = router;
