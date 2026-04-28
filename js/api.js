import { STATIC_EVENTS, STATIC_PRODUCTS, STATIC_SERIES_META } from './staticData.js?v=20260429';

const API_BASE = '/api';

async function requestJson(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        credentials: 'same-origin',
        ...options,
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
        ? await response.json()
        : {};

    if (!response.ok) {
        const message = payload.error || `Request failed (${response.status})`;
        const error = new Error(message);
        error.status = response.status;
        error.payload = payload;
        throw error;
    }

    return payload;
}

function jsonRequest(path, method, body) {
    return requestJson(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

function formRequest(path, method, formData) {
    return requestJson(path, {
        method,
        body: formData,
    });
}

export async function fetchProducts() {
    try {
        const { data = [] } = await requestJson('/products');
        return data;
    } catch (error) {
        console.warn('fetchProducts: using static storefront data', error);
        return STATIC_PRODUCTS;
    }
}

export function uploadProduct(formData) {
    return formRequest('/products', 'POST', formData);
}

export function updateProduct(id, formData) {
    return formRequest(`/products/${id}`, 'PUT', formData);
}

export function deleteProduct(id) {
    return requestJson(`/products/${id}`, { method: 'DELETE' });
}

export function createOrder(orderData) {
    return jsonRequest('/orders', 'POST', orderData);
}

export async function fetchOrders() {
    try {
        const { data = [] } = await requestJson('/orders');
        return data;
    } catch (error) {
        console.error('fetchOrders:', error);
        return [];
    }
}

export function updateOrderStatus(id, status) {
    return jsonRequest(`/orders/${id}/status`, 'PUT', { status });
}

export async function loginAdmin(credentials) {
    return jsonRequest('/auth/login', 'POST', credentials);
}

export async function logoutAdmin() {
    return jsonRequest('/auth/logout', 'POST', {});
}

export async function fetchAdminSession() {
    try {
        const { authenticated = false } = await requestJson('/auth/session');
        return authenticated;
    } catch (error) {
        console.error('fetchAdminSession:', error);
        return false;
    }
}

export async function fetchPublicEvents() {
    try {
        const { data = [] } = await requestJson('/events');
        return data;
    } catch (error) {
        console.warn('fetchPublicEvents: using static events data', error);
        return STATIC_EVENTS;
    }
}

export function fetchAllEvents() {
    return requestJson('/events/all');
}

export function saveEvent(payload, eventId = '') {
    const path = eventId ? `/events/${eventId}` : '/events';
    const method = eventId ? 'PUT' : 'POST';
    return jsonRequest(path, method, payload);
}

export function deleteEvent(eventId) {
    return requestJson(`/events/${eventId}`, { method: 'DELETE' });
}

export function bookEvent(eventId, payload) {
    return jsonRequest(`/events/${eventId}/book`, 'POST', payload);
}

export async function fetchSeriesMeta() {
    try {
        const data = await requestJson('/series-meta');
        return data; // Array of { name, description }
    } catch (error) {
        console.warn('fetchSeriesMeta: using static series data', error);
        return STATIC_SERIES_META;
    }
}

export function updateSeriesMeta(name, description) {
    return jsonRequest('/series-meta', 'PUT', { name, description });
}
