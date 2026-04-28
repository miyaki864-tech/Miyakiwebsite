import { getCart } from './cart.js';
import { createOrder } from './api.js';
import { CURRENCY_CODE, formatCurrency, parseCurrency } from './currency.js';

const CHECKOUT_STEPS = ['step-contact', 'step-shipping', 'step-payment'];
const UPI_BASE_URL = 'upi://pay?pa=miyaki@upi&pn=Miyaki';

function validateStep(stepEl) {
    if (!stepEl) return true;
    const requiredFields = stepEl.querySelectorAll('input[required], select[required], textarea[required]');
    for (const field of requiredFields) {
        if (!field.reportValidity()) return false;
    }
    return true;
}

function toggleStep(stepId) {
    CHECKOUT_STEPS.forEach((id) => {
        const step = document.getElementById(id);
        if (!step) return;

        if (id === stepId) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active');
        }
    });
}

function markStepComplete(stepId) {
    const step = document.getElementById(stepId);
    if (!step) return;

    step.classList.remove('active');
    step.classList.add('completed');
    const numberSpan = step.querySelector('.step-number');
    if (numberSpan) numberSpan.textContent = '✓';
}

function resetStepNumbers(activeStepId) {
    CHECKOUT_STEPS.forEach((id, index) => {
        const step = document.getElementById(id);
        if (!step) return;

        const numberSpan = step.querySelector('.step-number');
        if (numberSpan) numberSpan.textContent = index + 1;

        if (id !== activeStepId) {
            step.classList.remove('completed');
        }
    });
}

function updatePaymentArtifacts(totalAmount) {
    const amount = Number(totalAmount).toFixed(2);
    const modalAmount = document.getElementById('modal-amount');
    const qrImage = document.getElementById('upi-qr-image');
    const upiIntentBtn = document.getElementById('btn-upi-intent');
    const upiUrl = `${UPI_BASE_URL}&am=${amount}&cu=${CURRENCY_CODE}`;

    if (modalAmount) modalAmount.textContent = formatCurrency(amount);
    if (qrImage) {
        qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUrl)}`;
    }
    if (upiIntentBtn) {
        upiIntentBtn.dataset.upiUrl = upiUrl;
    }
}

export function initCheckout() {
    const accordionSteps = document.querySelectorAll('.accordion-step');
    if (accordionSteps.length === 0) return;

    if (window.visualViewport && window.innerWidth <= 768) {
        window.visualViewport.addEventListener('resize', () => {
            const wrapper = document.querySelector('.checkout-wrapper');
            if (!wrapper) return;

            const heightDiff = window.innerHeight - window.visualViewport.height;
            wrapper.style.paddingBottom = heightDiff > 0 ? `${heightDiff + 20}px` : '0px';
        });
    }

    const cart = getCart();
    const overviewContainer = document.getElementById('order-overview-container');
    const subtotalDisplay = document.getElementById('subtotal-display');
    const grandTotalElem = document.getElementById('grand-total');
    const shippingQuote = document.getElementById('shipping-quote-display');

    let subtotal = 0;
    let shippingCost = 0;

    if (overviewContainer) {
        overviewContainer.innerHTML = '';

        if (cart.length === 0) {
            overviewContainer.innerHTML = '<p class="summary-empty">Your cart is empty.</p>';
        } else {
            cart.forEach((item) => {
                const numericPrice = parseCurrency(item.price);
                const displayPrice = formatCurrency(item.price);
                subtotal += numericPrice;

                overviewContainer.innerHTML += `
                    <div class="summary-item">
                        <img src="${item.imgSrc}" alt="${item.name}" class="summary-item-image">
                        <div class="summary-item-copy">
                            <h3>${item.name}</h3>
                            <p>${displayPrice}</p>
                        </div>
                    </div>
                `;
            });
        }
    }

    function updateTotals() {
        const total = subtotal + shippingCost;
        if (subtotalDisplay) subtotalDisplay.textContent = formatCurrency(subtotal);
        if (grandTotalElem) grandTotalElem.textContent = formatCurrency(total);
        updatePaymentArtifacts(total);
    }

    updateTotals();

    const pincodeInput = document.getElementById('pincode');
    if (pincodeInput && shippingQuote) {
        pincodeInput.addEventListener('blur', () => {
            if (pincodeInput.value.trim().length >= 5) {
                shippingCost = 15;
                shippingQuote.textContent = `Shipping: ${formatCurrency(shippingCost)} (Express Delivery)`;
            } else {
                shippingCost = 0;
                shippingQuote.textContent = 'Shipping: Calculated upon PIN';
            }
            updateTotals();
        });
    }

    document.querySelectorAll('.next-step').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();

            const currentStepEl = event.currentTarget.closest('.accordion-step');
            const nextStepId = event.currentTarget.getAttribute('data-next');

            if (!currentStepEl || !nextStepId) return;
            if (!validateStep(currentStepEl)) return;

            markStepComplete(currentStepEl.id);
            toggleStep(nextStepId);
        });
    });

    document.querySelectorAll('.step-header').forEach((header) => {
        header.addEventListener('click', (event) => {
            const stepEl = event.target.closest('.accordion-step');
            if (!stepEl || !stepEl.classList.contains('completed')) return;

            resetStepNumbers(stepEl.id);
            toggleStep(stepEl.id);
        });
    });

    const upiDesktop = document.getElementById('upi-desktop');
    const upiMobile = document.getElementById('upi-mobile');
    const isMobile = window.innerWidth <= 768 || navigator.userAgent.includes('Mobi');

    if (isMobile) {
        if (upiMobile) upiMobile.style.display = 'block';
        if (upiDesktop) upiDesktop.style.display = 'none';
        const otherPayBtn = document.getElementById('btn-pay-other');
        if (otherPayBtn) otherPayBtn.style.display = 'none';
    } else {
        if (upiDesktop) upiDesktop.style.display = 'block';
        if (upiMobile) upiMobile.style.display = 'none';
    }

    const paymentModal = document.getElementById('payment-modal');
    const closeModal = document.getElementById('close-modal');
    const btnPayOther = document.getElementById('btn-pay-other');
    const btnUpiIntent = document.getElementById('btn-upi-intent');
    const btnPayCOD = document.getElementById('btn-pay-cod');
    const simSuccess = document.getElementById('simulate-success');
    const simFailure = document.getElementById('simulate-failure');

    const openPaymentModal = (event) => {
        event.preventDefault();
        if (paymentModal) paymentModal.classList.add('active');
    };

    btnPayOther?.addEventListener('click', openPaymentModal);
    btnUpiIntent?.addEventListener('click', openPaymentModal);

    closeModal?.addEventListener('click', () => {
        paymentModal?.classList.remove('active');
    });

    async function submitCheckoutOrder(triggerButton) {
        if (!cart.length) {
            alert('Your cart is empty.');
            return;
        }

        const paymentStep = document.getElementById('step-payment');
        if (paymentStep && !validateStep(document.getElementById('step-contact'))) {
            toggleStep('step-contact');
            return;
        }
        if (paymentStep && !validateStep(document.getElementById('step-shipping'))) {
            toggleStep('step-shipping');
            return;
        }

        const originalText = triggerButton?.textContent;
        if (triggerButton) {
            triggerButton.textContent = 'Processing...';
            triggerButton.disabled = true;
        }

        try {
            const totalText = grandTotalElem ? grandTotalElem.textContent : '0';
            const orderData = {
                contact: {
                    email: document.getElementById('email')?.value.trim() || '',
                },
                shipping: {
                    firstName: document.getElementById('shipping-fname')?.value.trim() || '',
                    lastName: document.getElementById('shipping-lname')?.value.trim() || '',
                    address: document.getElementById('shipping-address')?.value.trim() || '',
                    city: document.getElementById('shipping-city')?.value.trim() || '',
                    pincode: document.getElementById('pincode')?.value.trim() || '',
                    phone: document.getElementById('shipping-phone')?.value.trim() || '',
                },
                items: cart,
                total: parseCurrency(totalText),
            };

            const response = await createOrder(orderData);
            sessionStorage.setItem('miyaki_last_order', JSON.stringify({
                orderId: response.orderId,
                total: grandTotalElem?.textContent || formatCurrency(0),
            }));
            localStorage.removeItem('miyaki_cart');
            window.location.href = 'tracking.html';
        } catch (error) {
            console.error(error);
            alert(`Checkout error: ${error.message}`);
            if (triggerButton) {
                triggerButton.textContent = originalText;
                triggerButton.disabled = false;
            }
        }
    }

    btnPayCOD?.addEventListener('click', (event) => {
        event.preventDefault();
        submitCheckoutOrder(btnPayCOD);
    });

    simSuccess?.addEventListener('click', () => {
        submitCheckoutOrder(simSuccess);
    });

    simFailure?.addEventListener('click', () => {
        alert('Payment Failed. Please try another method.');
        paymentModal?.classList.remove('active');
    });
}
