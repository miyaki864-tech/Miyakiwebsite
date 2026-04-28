import { bookEvent, fetchPublicEvents } from '../api.js';

/* ─── Helpers ─────────────────────────────────────── */
function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
}

function spotsLeft(capacity, booked) {
    if (!capacity || capacity === 0) return null;
    return Math.max(0, capacity - booked);
}

/* ─── Events Renderer ─────────────────────────────── */
export async function renderEvents(container) {
    try {
        const events = await fetchPublicEvents();
        renderEventsLayout(container, events);
    } catch (e) {
        container.innerHTML = `<div class="pr-events-error">Could not load events.</div>`;
    }
}

function renderEventsLayout(container, events) {
    const upcomingCount = events.filter(e => e.status !== 'cancelled').length;
    const nextEvent    = events.find(e => e.status !== 'cancelled');
    const nextCity     = nextEvent?.city  || '—';

    container.innerHTML = `
        <div class="pr-bespoke-layout events-bento reveal-up active">

            <!-- CARD 1: Hero — col 1–2, row 1 -->
            <div class="sb-card sb-card--ev-hero">
                <div class="sb-card-inner">
                    <p class="sb-eyebrow">EVENTS</p>
                    <h1 class="sb-ev-title">Where Objects<br>Meet.</h1>
                    <p class="sb-hero-sub">Physical encounters.</p>
                </div>
            </div>

            <!-- CARD 2: Upcoming count — col 3, row 1 -->
            <div class="sb-card sb-card--stat sb-card--accent">
                <div class="sb-card-inner">
                    <p class="sb-stat-label">UPCOMING</p>
                    <div class="sb-stat-line">
                        <span class="sb-stat-num">${String(upcomingCount).padStart(2, '0')}</span>
                    </div>
                </div>
            </div>

            <!-- CARD 3: Next location — col 4, row 1 -->
            <div class="sb-card sb-card--stat sb-card--dark">
                <div class="sb-card-inner">
                    <p class="sb-stat-label">LOCATIONS</p>
                    <p class="sb-ev-city">${nextCity.toUpperCase()}</p>
                </div>
            </div>

            <!-- Event cards (rows 2+, 2 cols each) -->
            ${events.length === 0
                ? `<div class="sb-card ev-card ev-card--empty">
                        <div class="sb-card-inner">
                            <p class="sb-stat-label">NO UPCOMING EVENTS</p>
                            <p class="ev-empty-text">Nothing scheduled yet.<br>Check back soon.</p>
                        </div>
                   </div>`
                : events.map(ev => buildEventBentoCard(ev)).join('')
            }

        </div>
    `;

    // Booking toggle
    container.querySelectorAll('.ev-card:not(.ev-card--empty)').forEach(card => {
        const btn = card.querySelector('.ev-reserve-btn');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const alreadyOpen = card.classList.contains('ev-open');
            // Close all open cards
            container.querySelectorAll('.ev-card.ev-open').forEach(c => {
                c.classList.remove('ev-open');
                const b = c.querySelector('.ev-reserve-btn');
                if (b) { b.textContent = 'RESERVE A PLACE'; b.dataset.state = 'closed'; }
            });
            if (!alreadyOpen) {
                card.classList.add('ev-open');
                btn.textContent = 'CANCEL ←';
                btn.dataset.state = 'open';
            }
        });
    });

    // Booking form submissions
    container.querySelectorAll('.ev-bento-form').forEach(form => {
        form.addEventListener('submit', handleBentoBooking);
    });
}

function buildEventBentoCard(ev) {
    const spots      = spotsLeft(ev.capacity, ev.booked);
    const isFull      = spots === 0;
    const isCancelled = ev.status === 'cancelled';
    const dateRange   = ev.date_end && ev.date_end !== ev.date_start
        ? `${fmtDate(ev.date_start)} — ${fmtDate(ev.date_end)}`
        : fmtDate(ev.date_start);

    const spotsTag = spots === null || isCancelled ? ''
        : isFull
            ? `<span class="ev-badge ev-badge--full">FULL</span>`
            : `<span class="ev-badge ev-badge--spots">${spots} SPOT${spots !== 1 ? 'S' : ''} LEFT</span>`;

    const statusTag = isCancelled
        ? `<span class="ev-badge ev-badge--cancelled">CANCELLED</span>`
        : `<span class="ev-badge ev-badge--upcoming">UPCOMING</span>`;

    const locationLine = [ev.city, ev.country].filter(Boolean).join(', ')
        + (ev.venue ? ` — ${ev.venue}` : '');

    const timeLine = ev.time ? ` · ${ev.time}` : '';

    return `
        <div class="sb-card ev-card ${isCancelled ? 'ev-card--is-cancelled' : ''}" data-id="${ev.id}">

            <!-- Info block -->
            <div class="ev-card-info">
                <div class="ev-badges">${statusTag}${spotsTag}</div>

                <h2 class="ev-card-title">${ev.title}</h2>

                <div class="ev-card-meta">
                    <span class="ev-meta-date">${dateRange}${timeLine}</span>
                    <span class="ev-meta-sep">·</span>
                    <span class="ev-meta-location">${locationLine}</span>
                </div>

                ${ev.description ? `<p class="ev-card-desc">${ev.description}</p>` : ''}
            </div>

            <!-- Footer CTA -->
            <div class="ev-card-foot">
                ${isCancelled
                    ? `<span class="ev-status-note">This event has been cancelled.</span>`
                    : isFull
                        ? `<span class="ev-status-note">Fully booked.</span>`
                        : `<button class="ev-reserve-btn" data-state="closed">RESERVE A PLACE</button>`
                }
                ${ev.capacity > 0 && !isCancelled
                    ? `<span class="ev-capacity-note">${ev.booked} / ${ev.capacity} attending</span>`
                    : ''}
            </div>

            <!-- Booking form (slides open) -->
            ${!isCancelled && !isFull ? `
                <div class="ev-form-wrap" id="ev-wrap-${ev.id}">
                    <form class="ev-bento-form" data-event-id="${ev.id}">
                        <div class="ev-form-grid">
                            <input type="text"   name="name"    placeholder="Full Name"     required autocomplete="name">
                            <input type="email"  name="email"   placeholder="Email Address" required autocomplete="email">
                            <input type="number" name="guests"  placeholder="Guests" value="1" min="1" max="${spots || 10}" class="ev-input-guests">
                            <textarea            name="message" placeholder="Note (optional)" rows="2"  class="ev-input-note"></textarea>
                        </div>
                        <button type="submit" class="ev-form-submit">
                            Confirm Reservation &nbsp;→
                        </button>
                    </form>
                </div>
            ` : ''}

        </div>
    `;
}

async function handleBentoBooking(e) {
    e.preventDefault();
    const form    = e.target;
    const eventId = form.dataset.eventId;
    const btn     = form.querySelector('.ev-form-submit');
    const wrap    = document.getElementById(`ev-wrap-${eventId}`);

    btn.disabled    = true;
    btn.textContent = 'Sending…';

    const body = {
        name:    form.name.value.trim(),
        email:   form.email.value.trim(),
        guests:  parseInt(form.guests.value) || 1,
        message: form.message?.value.trim() || '',
    };

    try {
        await bookEvent(eventId, body);

        wrap.innerHTML = `
            <div class="ev-success">
                <span class="ev-success-check">✓</span>
                <p class="ev-success-title">You're on the list.</p>
                <p class="ev-success-sub">Confirmation sent to <strong>${body.email}</strong>.</p>
            </div>
        `;
    } catch (err) {
        btn.disabled    = false;
        btn.textContent = 'Confirm Reservation →';
        const msg = document.createElement('p');
        msg.className   = 'ev-form-error';
        msg.textContent = err.message;
        wrap.appendChild(msg);
        setTimeout(() => msg.remove(), 4000);
    }
}
