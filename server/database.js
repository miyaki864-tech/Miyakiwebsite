const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('./config');

const db = new sqlite3.Database(DB_PATH);

const PRODUCT_TABLE_SQL = `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    series TEXT NOT NULL,
    image_url TEXT NOT NULL,
    tags TEXT,
    description TEXT DEFAULT '',
    contents TEXT DEFAULT '',
    size TEXT DEFAULT ''
)`;

const SERIES_META_TABLE_SQL = `CREATE TABLE IF NOT EXISTS series_meta (
    name TEXT PRIMARY KEY,
    description TEXT
)`;

const ORDER_TABLE_SQL = `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_email TEXT,
    shipping_address TEXT,
    phone TEXT,
    total_amount REAL,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

const ORDER_ITEM_TABLE_SQL = `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_name TEXT,
    price REAL,
    quantity INTEGER,
    FOREIGN KEY (order_id) REFERENCES orders (id)
)`;

const EVENTS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    venue TEXT,
    date_start TEXT NOT NULL,
    date_end TEXT,
    time TEXT,
    description TEXT,
    capacity INTEGER DEFAULT 0,
    status TEXT DEFAULT 'upcoming',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

const EVENT_BOOKINGS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS event_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    guests INTEGER DEFAULT 1,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id)
)`;

const PUBLIC_EVENTS_SQL = `
    SELECT e.*,
           COUNT(b.id) AS booked
    FROM events e
    LEFT JOIN event_bookings b ON b.event_id = e.id
    WHERE e.status != 'past'
    GROUP BY e.id
    ORDER BY e.date_start ASC
`;

const ADMIN_EVENTS_SQL = `
    SELECT e.*,
           COUNT(b.id) AS booked
    FROM events e
    LEFT JOIN event_bookings b ON b.event_id = e.id
    GROUP BY e.id
    ORDER BY e.date_start DESC
`;

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function onRun(err) {
            if (err) return reject(err);
            return resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            return resolve(row);
        });
    });
}

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            return resolve(rows);
        });
    });
}

async function seedSeriesMeta() {
    try {
        const rows = await dbAll('SELECT COUNT(*) as count FROM series_meta');
        if (rows[0].count !== 0) return;

        const examples = [
            { name: 'Stoneware', desc: 'Embracing raw textures and uneven forms.' },
            { name: 'Wabi-Sabi', desc: 'Finding profound beauty in natural imperfections.' },
            { name: 'Studio', desc: 'Experimental pieces crafted in the Calcutta kiln.' },
        ];

        for (const item of examples) {
            await dbRun('INSERT INTO series_meta (name, description) VALUES (?, ?)', [item.name, item.desc]);
        }
    } catch (error) {
        console.error('Failed to seed series metadata', error);
    }
}

async function ensureProductColumns() {
    const columns = await dbAll('PRAGMA table_info(products)');
    const columnNames = new Set(columns.map((column) => column.name));

    if (!columnNames.has('description')) {
        await dbRun("ALTER TABLE products ADD COLUMN description TEXT DEFAULT ''");
    }

    if (!columnNames.has('contents')) {
        await dbRun("ALTER TABLE products ADD COLUMN contents TEXT DEFAULT ''");
    }

    if (!columnNames.has('size')) {
        await dbRun("ALTER TABLE products ADD COLUMN size TEXT DEFAULT ''");
    }
}

async function initializeDatabase() {
    await Promise.all([
        dbRun(PRODUCT_TABLE_SQL),
        dbRun(ORDER_TABLE_SQL),
        dbRun(ORDER_ITEM_TABLE_SQL),
        dbRun(SERIES_META_TABLE_SQL),
    ]);

    await ensureProductColumns();
    await seedSeriesMeta();

    const columns = await dbAll('PRAGMA table_info(events)');
    const hasTitle = columns.some((column) => column.name === 'title');

    if (!hasTitle && columns.length > 0) {
        console.log('Old events table schema detected. Migrating database...');
        await dbRun('DROP TABLE IF EXISTS event_bookings');
        await dbRun('DROP TABLE IF EXISTS events');
        console.log('Reset events schema to latest version.');
    }

    await dbRun(EVENTS_TABLE_SQL);
    await dbRun(EVENT_BOOKINGS_TABLE_SQL);
}

module.exports = {
    ADMIN_EVENTS_SQL,
    PUBLIC_EVENTS_SQL,
    dbAll,
    dbGet,
    dbRun,
    initializeDatabase,
};
