const { startServer } = require('../server');
const { buildProductSlug } = require('../server/productLinks');

const PORT = Number(process.env.SMOKE_PORT) || 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function request(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, options);
    return response;
}

async function expectOk(path) {
    const response = await request(path);
    if (!response.ok) {
        throw new Error(`${path} returned ${response.status}`);
    }
}

async function expectJsonData(path) {
    const response = await request(path);
    if (!response.ok) {
        throw new Error(`${path} returned ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload.data) && !Array.isArray(payload)) {
        throw new Error(`${path} did not return an array payload`);
    }

    return payload;
}

async function expectRedirect(path, target) {
    const response = await request(path, { redirect: 'manual' });
    if (response.status < 300 || response.status > 399) {
        throw new Error(`${path} did not redirect`);
    }
    if (response.headers.get('location') !== target) {
        throw new Error(`${path} redirected to ${response.headers.get('location')}, expected ${target}`);
    }
}

async function expectText(path, expectedText) {
    const response = await request(path);
    if (!response.ok) {
        throw new Error(`${path} returned ${response.status}`);
    }

    const text = await response.text();
    if (!text.includes(expectedText)) {
        throw new Error(`${path} did not include "${expectedText}"`);
    }
}

async function run() {
    const server = await startServer(PORT);

    try {
        await expectOk('/shop.html');
        await expectText('/shop.html', 'Dimensions');
        await expectText('/shop.html', 'Items Included');
        await expectOk('/archive.html');
        await expectOk('/checkout.html');
        await expectOk('/tracking.html');
        await expectOk('/login.html');
        const productsPayload = await expectJsonData('/api/products');
        await expectJsonData('/api/series-meta');
        if (productsPayload.data?.[0]) {
            await expectOk(`/product/${buildProductSlug(productsPayload.data[0])}`);
        }
        await expectRedirect('/admin.html', '/login.html');
        console.log('Smoke test passed');
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

run().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
