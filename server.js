const path = require('path');
const express = require('express');
const cors = require('cors');

const { PORT, ROOT_DIR } = require('./server/config');
const { initializeDatabase } = require('./server/database');
const { requireAdminPage } = require('./server/middleware/auth');
const authRoutes = require('./server/routes/authRoutes');
const eventRoutes = require('./server/routes/eventRoutes');
const orderRoutes = require('./server/routes/orderRoutes');
const productRoutes = require('./server/routes/productRoutes');
const productShareRoutes = require('./server/routes/productShareRoutes');
const seriesMetaRoutes = require('./server/routes/seriesMetaRoutes');

function createApp() {
    const app = express();

    app.set('trust proxy', true);
    app.use(cors());
    app.use(express.json());

    app.use('/api/auth', authRoutes);
    app.use('/api/series-meta', seriesMetaRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/events', eventRoutes);
    app.use('/product', productShareRoutes);

    app.get('/', (_req, res) => res.redirect('/shop.html'));
    app.get('/index.html', (_req, res) => res.redirect('/shop.html'));
    app.get('/favicon.ico', (_req, res) => res.status(204).end());
    app.get('/admin.html', requireAdminPage, (_req, res) => {
        return res.sendFile(path.join(ROOT_DIR, 'admin.html'));
    });

    app.use(express.static(ROOT_DIR));

    return app;
}

async function startServer(port = PORT) {
    await initializeDatabase();

    const app = createApp();
    return app.listen(port, () => {
        console.log(`Server running on port ${port}`);
        console.log(`Open http://localhost:${port} in your browser`);
    });
}

if (require.main === module) {
    startServer().catch((error) => {
        console.error(`Error opening database: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    createApp,
    startServer,
};
