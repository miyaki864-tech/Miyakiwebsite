export function initTracking() {
    const orderIdEl = document.getElementById('tracking-order-id');
    const totalEl = document.getElementById('tracking-total');
    const copyEl = document.getElementById('tracking-copy');
    if (!orderIdEl || !totalEl || !copyEl) return;

    const raw = sessionStorage.getItem('miyaki_last_order');
    const order = raw ? JSON.parse(raw) : null;

    if (!order) {
        copyEl.textContent = 'Your order was placed, but this confirmation has no session data attached to it.';
        orderIdEl.textContent = 'Unavailable';
        totalEl.textContent = 'Unavailable';
        return;
    }

    orderIdEl.textContent = `#${order.orderId}`;
    totalEl.textContent = order.total;
    copyEl.textContent = `Your order ${orderIdEl.textContent} has been received. We will reach out using the details you entered at checkout.`;
}
