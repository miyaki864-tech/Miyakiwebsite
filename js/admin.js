import {
    deleteEvent,
    deleteProduct,
    fetchAllEvents,
    fetchOrders,
    fetchProducts,
    fetchSeriesMeta,
    updateSeriesMeta,
    logoutAdmin,
    saveEvent,
    updateOrderStatus,
    updateProduct,
    uploadProduct,
} from './api.js';
import { formatCurrency } from './currency.js';
import { escapeHtml } from './utils/dom.js';

const VIEW_KEYS = ['inventory', 'collections', 'orders', 'events', 'form'];

function buildTableStateRow({ colspan, message, className = '', center = true, faded = true }) {
    const classes = [
        'admin-table-state',
        center ? '' : 'admin-table-state--left',
        faded ? '' : 'admin-table-state--solid',
        className,
    ].filter(Boolean).join(' ');

    return `<tr><td colspan="${colspan}" class="${classes}">${escapeHtml(message)}</td></tr>`;
}

function setMessage(element, text = '', tone = '') {
    if (!element) return;
    element.textContent = text;
    element.className = tone;
}

function formatEventDate(value) {
    if (!value) return '—';
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatOrderDate(value) {
    const date = new Date(`${value}Z`);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    })}`;
}

function buildInventoryRow(product) {
    const rawDescription = String(product.description || '');
    const rawSize = String(product.size || '');
    const rawContents = String(product.contents || '');
    const descriptionPreview = rawDescription
        ? escapeHtml(rawDescription.slice(0, 90))
        : '<span class="admin-muted">Not set</span>';
    const sizePreview = rawSize
        ? escapeHtml(rawSize)
        : '<span class="admin-muted">Not set</span>';
    const contentsPreview = rawContents
        ? escapeHtml(rawContents.slice(0, 90))
        : '<span class="admin-muted">Not set</span>';

    return `
        <tr>
            <td><img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}" class="thumb-img"></td>
            <td><strong>${escapeHtml(product.name)}</strong></td>
            <td>${escapeHtml(product.series || 'Uncategorized')}</td>
            <td>${formatCurrency(product.price)}</td>
            <td class="inventory-copy-cell">${descriptionPreview}${rawDescription.length > 90 ? '...' : ''}</td>
            <td class="inventory-copy-cell inventory-copy-cell--compact">${sizePreview}</td>
            <td class="inventory-copy-cell">${contentsPreview}${rawContents.length > 90 ? '...' : ''}</td>
            <td class="action-btns">
                <button class="btn-action edit-btn" data-id="${product.id}">Edit</button>
                <button class="btn-action btn-delete delete-btn" data-id="${product.id}" data-name="${escapeHtml(product.name)}">Delete</button>
            </td>
        </tr>
    `;
}

function buildOrderRow(order) {
    const itemsList = (order.items || [])
        .map((item) => `${item.quantity}x ${item.product_name}`)
        .join(', ');

    return `
        <tr>
            <td><strong>#${order.id}</strong></td>
            <td class="order-date">${escapeHtml(formatOrderDate(order.created_at))}</td>
            <td>
                <div class="order-customer-name">${escapeHtml(order.customer_name)}</div>
                <div class="order-customer-line">${escapeHtml(order.customer_email)}</div>
                <div class="order-customer-address">${escapeHtml(order.shipping_address)}<br>Phone: ${escapeHtml(order.phone)}</div>
                <div class="order-items">Items: ${escapeHtml(itemsList)}</div>
            </td>
            <td><strong class="order-total">${formatCurrency(order.total_amount)}</strong></td>
            <td>
                <select class="status-select" data-id="${order.id}">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td class="action-btns">
                <button class="btn-action update-order-btn" data-id="${order.id}">Update</button>
            </td>
        </tr>
    `;
}

function buildEventRow(event) {
    const statusClass = event.status === 'upcoming'
        ? 'event-status--upcoming'
        : event.status === 'cancelled'
            ? 'event-status--cancelled'
            : 'event-status--past';

    return `
        <tr>
            <td><strong>${escapeHtml(event.title)}</strong>${event.subtitle ? `<br><small class="event-subtitle">${escapeHtml(event.subtitle)}</small>` : ''}</td>
            <td>${escapeHtml(event.city)}, ${escapeHtml(event.country)}</td>
            <td>${escapeHtml(formatEventDate(event.date_start))}</td>
            <td><span class="event-status ${statusClass}">${escapeHtml(event.status)}</span></td>
            <td>${event.booked || 0}${event.capacity > 0 ? ` / ${event.capacity}` : ''}</td>
            <td class="action-btns">
                <button class="btn-action ev-edit-btn" data-id="${event.id}">Edit</button>
                <button class="btn-action btn-delete ev-delete-btn" data-id="${event.id}" data-name="${escapeHtml(event.title)}">Delete</button>
            </td>
        </tr>
    `;
}

export function initAdmin() {
    const refs = {
        navInventory: document.getElementById('nav-inventory'),
        navCollections: document.getElementById('nav-collections'),
        navOrders: document.getElementById('nav-orders'),
        navEvents: document.getElementById('nav-events'),
        navAdd: document.getElementById('nav-add'),
        navLogout: document.getElementById('nav-logout'),
        viewInventory: document.getElementById('view-inventory'),
        viewCollections: document.getElementById('view-collections'),
        viewOrders: document.getElementById('view-orders'),
        viewEvents: document.getElementById('view-events'),
        viewForm: document.getElementById('view-form'),
        inventoryTbody: document.getElementById('inventory-tbody'),
        collectionsTbody: document.getElementById('collections-tbody'),
        ordersTbody: document.getElementById('orders-tbody'),
        evTbody: document.getElementById('ev-tbody'),
        productForm: document.getElementById('productForm'),
        submitBtn: document.getElementById('submitBtn'),
        statusMessage: document.getElementById('status-message'),
        formTitle: document.getElementById('form-title'),
        formSubtitle: document.getElementById('form-subtitle'),
        formMode: document.getElementById('formMode'),
        productIdInput: document.getElementById('productId'),
        existingImageInput: document.getElementById('existingImage'),
        imageHint: document.getElementById('image-hint'),
        seriesSelect: document.getElementById('productSeries'),
        newSeriesInput: document.getElementById('newProductSeries'),
        deleteModal: document.getElementById('delete-modal'),
        deleteTargetName: document.getElementById('delete-target-name'),
        cancelDeleteBtn: document.getElementById('cancel-delete'),
        confirmDeleteBtn: document.getElementById('confirm-delete'),
        evFormWrap: document.getElementById('ev-form-wrap'),
        evForm: document.getElementById('ev-form'),
        evFormTitle: document.getElementById('ev-form-title'),
        evNewBtn: document.getElementById('ev-new-btn'),
        evCancelBtn: document.getElementById('ev-cancel-btn'),
        evStatusMsg: document.getElementById('ev-status-msg'),
        evSubmitBtn: document.getElementById('ev-submit-btn'),
        eventFields: {
            id: document.getElementById('ev-id'),
            title: document.getElementById('ev-title'),
            subtitle: document.getElementById('ev-subtitle'),
            city: document.getElementById('ev-city'),
            country: document.getElementById('ev-country'),
            venue: document.getElementById('ev-venue'),
            dateStart: document.getElementById('ev-date-start'),
            dateEnd: document.getElementById('ev-date-end'),
            time: document.getElementById('ev-time'),
            capacity: document.getElementById('ev-capacity'),
            status: document.getElementById('ev-status'),
            description: document.getElementById('ev-desc'),
        },
    };

    if (!refs.navInventory) return;

    const views = {
        inventory: refs.viewInventory,
        collections: refs.viewCollections,
        orders: refs.viewOrders,
        events: refs.viewEvents,
        form: refs.viewForm,
    };

    const navs = {
        inventory: refs.navInventory,
        collections: refs.navCollections,
        orders: refs.navOrders,
        events: refs.navEvents,
        form: refs.navAdd,
    };

    const state = {
        availableSeries: [],
        productsById: new Map(),
        eventsById: new Map(),
        deleteTarget: null,
    };

    function toggleNewSeriesInput(visible) {
        if (!refs.newSeriesInput) return;
        refs.newSeriesInput.classList.toggle('is-hidden', !visible);
        refs.newSeriesInput.required = visible;
        if (!visible) refs.newSeriesInput.value = '';
    }

    function renderSeriesOptions() {
        if (!refs.seriesSelect) return;

        const options = [
            '<option value="" disabled selected>Select a collection...</option>',
            ...state.availableSeries.map((series) => (
                `<option value="${escapeHtml(series)}">${escapeHtml(series)}</option>`
            )),
            '<option value="new">+ Add New Collection</option>',
        ];

        refs.seriesSelect.innerHTML = options.join('');
        toggleNewSeriesInput(false);
    }

    function setActiveView(viewKey, activeNavKey = viewKey) {
        VIEW_KEYS.forEach((key) => {
            views[key]?.classList.toggle('active', key === viewKey);
            navs[key]?.classList.toggle('active', key === activeNavKey);
        });
    }

    function resetProductForm({ clearMessage = true } = {}) {
        refs.productForm?.reset();
        refs.formMode.value = 'add';
        refs.formTitle.textContent = 'Add New Product';
        refs.formSubtitle.textContent = 'Upload a new piece to the catalog.';
        refs.imageHint.classList.add('is-hidden');
        toggleNewSeriesInput(false);

        if (clearMessage) {
            setMessage(refs.statusMessage);
        }
    }

    function populateProductForm(product) {
        if (!state.availableSeries.includes(product.series)) {
            state.availableSeries.push(product.series);
            renderSeriesOptions();
        }

        refs.formMode.value = 'edit';
        refs.formTitle.textContent = 'Edit Product';
        refs.formSubtitle.textContent = 'Modify product details in the catalog.';
        refs.productIdInput.value = product.id;
        refs.existingImageInput.value = product.image_url;
        refs.imageHint.classList.remove('is-hidden');

        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productTags').value = product.tags || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productSize').value = product.size || '';
        document.getElementById('productContents').value = product.contents || '';
        refs.seriesSelect.value = product.series;

        toggleNewSeriesInput(false);
        setMessage(refs.statusMessage);
    }

    function openDeleteModal(id, name, context) {
        state.deleteTarget = { id, context };
        refs.deleteTargetName.textContent = name;
        refs.deleteModal.classList.add('active');
    }

    function closeDeleteModal() {
        state.deleteTarget = null;
        refs.deleteModal.classList.remove('active');
    }

    function readEventPayload() {
        return {
            title: refs.eventFields.title.value.trim(),
            subtitle: refs.eventFields.subtitle.value.trim(),
            city: refs.eventFields.city.value.trim(),
            country: refs.eventFields.country.value.trim(),
            venue: refs.eventFields.venue.value.trim(),
            date_start: refs.eventFields.dateStart.value,
            date_end: refs.eventFields.dateEnd.value,
            time: refs.eventFields.time.value.trim(),
            capacity: Number.parseInt(refs.eventFields.capacity.value, 10) || 0,
            status: refs.eventFields.status.value,
            description: refs.eventFields.description.value.trim(),
        };
    }

    function openEventForm(event = null) {
        refs.evFormWrap.classList.remove('is-hidden');
        refs.evFormTitle.textContent = event ? 'Edit Event' : 'New Event';
        refs.eventFields.id.value = event?.id || '';
        refs.eventFields.title.value = event?.title || '';
        refs.eventFields.subtitle.value = event?.subtitle || '';
        refs.eventFields.city.value = event?.city || '';
        refs.eventFields.country.value = event?.country || '';
        refs.eventFields.venue.value = event?.venue || '';
        refs.eventFields.dateStart.value = event?.date_start || '';
        refs.eventFields.dateEnd.value = event?.date_end || '';
        refs.eventFields.time.value = event?.time || '';
        refs.eventFields.capacity.value = event?.capacity || 0;
        refs.eventFields.status.value = event?.status || 'upcoming';
        refs.eventFields.description.value = event?.description || '';
        setMessage(refs.evStatusMsg);
        refs.evFormWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function closeEventForm() {
        refs.evFormWrap.classList.add('is-hidden');
        refs.evForm?.reset();
        refs.eventFields.id.value = '';
        refs.eventFields.capacity.value = 0;
        refs.eventFields.status.value = 'upcoming';
        setMessage(refs.evStatusMsg);
    }

    async function loadInventory() {
        if (!refs.inventoryTbody) return;

        refs.inventoryTbody.innerHTML = buildTableStateRow({
            colspan: 8,
            message: 'Loading inventory...',
            center: false,
            faded: false,
        });

        try {
            const products = await fetchProducts();
            state.productsById = new Map(products.map((product) => [String(product.id), product]));

            const seriesSet = new Set();
            products.forEach((product) => seriesSet.add(product.series || 'Uncategorized'));
            state.availableSeries = Array.from(seriesSet);
            renderSeriesOptions();

            if (products.length === 0) {
                refs.inventoryTbody.innerHTML = buildTableStateRow({
                    colspan: 8,
                    message: 'No products found.',
                    center: false,
                    faded: false,
                });
                return;
            }

            refs.inventoryTbody.innerHTML = products.map(buildInventoryRow).join('');
        } catch (error) {
            refs.inventoryTbody.innerHTML = buildTableStateRow({
                colspan: 8,
                message: `Failed to load inventory: ${error.message}`,
                className: 'error',
                center: false,
                faded: false,
            });
        }
    }

    async function loadOrders() {
        if (!refs.ordersTbody) return;

        refs.ordersTbody.innerHTML = buildTableStateRow({
            colspan: 6,
            message: 'Loading orders...',
            center: false,
            faded: false,
        });

        try {
            const orders = await fetchOrders();
            if (orders.length === 0) {
                refs.ordersTbody.innerHTML = buildTableStateRow({
                    colspan: 6,
                    message: 'No orders found.',
                    center: false,
                    faded: false,
                });
                return;
            }

            refs.ordersTbody.innerHTML = orders.map(buildOrderRow).join('');
        } catch (error) {
            refs.ordersTbody.innerHTML = buildTableStateRow({
                colspan: 6,
                message: `Failed to load orders: ${error.message}`,
                className: 'error',
                center: false,
                faded: false,
            });
        }
    }

    async function loadEvents() {
        if (!refs.evTbody) return;

        refs.evTbody.innerHTML = buildTableStateRow({ colspan: 6, message: 'Loading…' });

        try {
            const { data: events = [] } = await fetchAllEvents();
            state.eventsById = new Map(events.map((event) => [String(event.id), event]));

            if (events.length === 0) {
                refs.evTbody.innerHTML = buildTableStateRow({
                    colspan: 6,
                    message: 'No events yet. Create one above.',
                });
                return;
            }

            refs.evTbody.innerHTML = events.map(buildEventRow).join('');
        } catch (error) {
            refs.evTbody.innerHTML = buildTableStateRow({
                colspan: 6,
                message: `Failed to load: ${error.message}`,
                className: 'error',
                faded: false,
            });
        }
    }

    async function loadCollections() {
        if (!refs.collectionsTbody) return;
        refs.collectionsTbody.innerHTML = buildTableStateRow({ colspan: 3, message: 'Loading collections...' });

        try {
            await fetchProducts(); // ensure availableSeries is loaded if not already
            const metaMap = new Map();
            const metas = await fetchSeriesMeta();
            metas.forEach(m => metaMap.set(m.name, m.description));

            if (state.availableSeries.length === 0) {
                refs.collectionsTbody.innerHTML = buildTableStateRow({ colspan: 3, message: 'No collections found. Add products first.' });
                return;
            }

            refs.collectionsTbody.innerHTML = state.availableSeries.map(seriesName => {
                const desc = metaMap.get(seriesName) || '';
                return `
                    <tr>
                        <td><strong>${escapeHtml(seriesName)}</strong></td>
                        <td>
                            <textarea class="coll-desc-input" data-name="${escapeHtml(seriesName)}">${escapeHtml(desc)}</textarea>
                        </td>
                        <td class="action-btns">
                            <button class="btn-action coll-save-btn" data-name="${escapeHtml(seriesName)}">Save</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            refs.collectionsTbody.innerHTML = buildTableStateRow({ colspan: 3, message: `Failed to load: ${error.message}`, className: 'error', faded: false });
        }
    }

    refs.seriesSelect?.addEventListener('change', () => {
        const isNewSeries = refs.seriesSelect.value === 'new';
        toggleNewSeriesInput(isNewSeries);

        if (isNewSeries) {
            refs.newSeriesInput.focus();
        }
    });

    refs.navInventory.addEventListener('click', () => {
        setActiveView('inventory');
        loadInventory();
    });

    refs.navCollections?.addEventListener('click', () => {
        setActiveView('collections');
        loadCollections();
    });

    refs.navOrders?.addEventListener('click', () => {
        setActiveView('orders');
        loadOrders();
    });

    refs.navEvents?.addEventListener('click', () => {
        setActiveView('events');
        loadEvents();
    });

    refs.navAdd.addEventListener('click', () => {
        setActiveView('form');
        resetProductForm();
    });

    refs.navLogout?.addEventListener('click', async () => {
        try {
            await logoutAdmin();
        } finally {
            window.location.href = 'login.html';
        }
    });

    refs.evNewBtn?.addEventListener('click', () => openEventForm());
    refs.evCancelBtn?.addEventListener('click', closeEventForm);

    refs.inventoryTbody?.addEventListener('click', (event) => {
        const editButton = event.target.closest('.edit-btn');
        if (editButton) {
            const product = state.productsById.get(editButton.dataset.id);
            if (!product) return;
            setActiveView('form', null);
            populateProductForm(product);
            return;
        }

        const deleteButton = event.target.closest('.delete-btn');
        if (deleteButton) {
            openDeleteModal(deleteButton.dataset.id, deleteButton.dataset.name, 'product');
        }
    });

    refs.collectionsTbody?.addEventListener('click', async (event) => {
        const saveBtn = event.target.closest('.coll-save-btn');
        if (!saveBtn) return;
        const name = saveBtn.dataset.name;
        const textarea = refs.collectionsTbody.querySelector(`.coll-desc-input[data-name="${name}"]`);
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '...';
        try {
            await updateSeriesMeta(name, textarea.value.trim());
            saveBtn.textContent = 'Saved';
            setTimeout(() => { saveBtn.textContent = 'Save'; }, 2000);
        } catch (error) {
            alert(`Error: ${error.message}`);
            saveBtn.textContent = originalText;
        }
    });

    refs.ordersTbody?.addEventListener('click', async (event) => {
        const updateButton = event.target.closest('.update-order-btn');
        if (!updateButton) return;

        const originalText = updateButton.textContent;
        const orderId = updateButton.dataset.id;
        const selectElement = refs.ordersTbody.querySelector(`.status-select[data-id="${orderId}"]`);
        const newStatus = selectElement?.value;

        updateButton.textContent = '...';

        try {
            const result = await updateOrderStatus(orderId, newStatus);
            if (result.message !== 'success') {
                throw new Error(result.error || 'Failed to update order');
            }

            updateButton.textContent = 'Saved';
            setTimeout(() => {
                updateButton.textContent = 'Update';
            }, 2000);
        } catch (error) {
            alert(`Error: ${error.message}`);
            updateButton.textContent = originalText;
        }
    });

    refs.evTbody?.addEventListener('click', (event) => {
        const editButton = event.target.closest('.ev-edit-btn');
        if (editButton) {
            const eventRecord = state.eventsById.get(editButton.dataset.id);
            if (eventRecord) openEventForm(eventRecord);
            return;
        }

        const deleteButton = event.target.closest('.ev-delete-btn');
        if (deleteButton) {
            openDeleteModal(deleteButton.dataset.id, deleteButton.dataset.name, 'event');
        }
    });

    refs.cancelDeleteBtn?.addEventListener('click', closeDeleteModal);

    refs.confirmDeleteBtn?.addEventListener('click', async () => {
        if (!state.deleteTarget) return;

        const originalText = refs.confirmDeleteBtn.textContent;
        refs.confirmDeleteBtn.textContent = 'Deleting...';
        refs.confirmDeleteBtn.disabled = true;

        try {
            if (state.deleteTarget.context === 'event') {
                await deleteEvent(state.deleteTarget.id);
                await loadEvents();
            } else {
                await deleteProduct(state.deleteTarget.id);
                await loadInventory();
            }

            closeDeleteModal();
        } catch (error) {
            alert(`Delete failed: ${error.message}`);
        } finally {
            refs.confirmDeleteBtn.textContent = originalText;
            refs.confirmDeleteBtn.disabled = false;
        }
    });

    refs.productForm?.addEventListener('submit', async (event) => {
        event.preventDefault();

        refs.submitBtn.textContent = 'Saving...';
        refs.submitBtn.disabled = true;
        setMessage(refs.statusMessage);

        const formData = new FormData(refs.productForm);
        if (formData.get('productSeries') === 'new') {
            formData.set('productSeries', formData.get('newProductSeries'));
        }
        formData.delete('newProductSeries');

        const mode = refs.formMode.value;

        try {
            const result = mode === 'add'
                ? await uploadProduct(formData)
                : await updateProduct(refs.productIdInput.value, formData);

            if (result.message !== 'success') {
                throw new Error(result.error || 'Operation failed');
            }

            if (mode === 'add') {
                resetProductForm({ clearMessage: false });
            }

            setMessage(
                refs.statusMessage,
                mode === 'add' ? 'Product added successfully!' : 'Product updated successfully!',
                'success'
            );

            await loadInventory();

            setTimeout(() => {
                if (refs.statusMessage.className === 'success') {
                    setMessage(refs.statusMessage);
                }
            }, 3000);
        } catch (error) {
            setMessage(refs.statusMessage, `Error: ${error.message}`, 'error');
        } finally {
            refs.submitBtn.textContent = 'Save Product';
            refs.submitBtn.disabled = false;
        }
    });

    refs.evForm?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const eventId = refs.eventFields.id.value;
        refs.evSubmitBtn.textContent = 'Saving…';
        refs.evSubmitBtn.disabled = true;

        try {
            await saveEvent(readEventPayload(), eventId);
            setMessage(refs.evStatusMsg, 'Saved successfully.', 'success');
            closeEventForm();
            await loadEvents();
        } catch (error) {
            setMessage(refs.evStatusMsg, error.message, 'error');
        } finally {
            refs.evSubmitBtn.textContent = 'Save Event';
            refs.evSubmitBtn.disabled = false;
        }
    });

    loadInventory();
}
