function parseMoney(value) {
    return parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0;
}

function buildOrderPayload(body = {}) {
    const contact = body.contact || {};
    const shipping = body.shipping || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const total = Number(body.total) || 0;
    const requiredFields = [
        contact.email,
        shipping.firstName,
        shipping.lastName,
        shipping.address,
        shipping.city,
        shipping.pincode,
        shipping.phone,
    ];

    if (requiredFields.some((field) => !field) || items.length === 0) {
        return null;
    }

    return {
        customerName: `${shipping.firstName} ${shipping.lastName}`.trim(),
        customerEmail: String(contact.email).trim(),
        shippingAddress: `${shipping.address}, ${shipping.city}, PIN: ${shipping.pincode}`,
        phone: String(shipping.phone).trim(),
        total,
        items: items.map((item) => ({
            name: item.name,
            price: parseMoney(item.price),
            quantity: Number(item.quantity) || 1,
        })),
    };
}

function buildProductResponse(id, body, imageUrl) {
    return {
        id,
        name: body.productName,
        price: body.productPrice,
        series: body.productSeries,
        image_url: imageUrl,
        tags: body.productTags || '',
        description: body.productDescription || '',
        contents: body.productContents || '',
        size: body.productSize || '',
    };
}

function sanitizeEventPayload(body = {}) {
    return {
        title: String(body.title || '').trim(),
        subtitle: String(body.subtitle || '').trim(),
        city: String(body.city || '').trim(),
        country: String(body.country || '').trim(),
        venue: String(body.venue || '').trim(),
        date_start: String(body.date_start || '').trim(),
        date_end: String(body.date_end || '').trim(),
        time: String(body.time || '').trim(),
        description: String(body.description || '').trim(),
        capacity: Number.parseInt(body.capacity, 10) || 0,
        status: String(body.status || 'upcoming').trim() || 'upcoming',
    };
}

module.exports = {
    buildOrderPayload,
    buildProductResponse,
    sanitizeEventPayload,
};
