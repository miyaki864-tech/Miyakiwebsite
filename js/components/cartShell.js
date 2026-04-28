const CART_SHELL_HTML = `
    <div class="cart-overlay" id="cart-overlay"></div>
    <aside class="cart-drawer full-screen-cart" id="cart-drawer" aria-label="Shopping cart">
        <section class="cart-left-panel" aria-hidden="true">
            <div class="cart-visual-copy">
                <span class="cart-kicker">MIYAKI CART</span>
                <h2>Review your pieces before checkout.</h2>
                <p>Each order is packed from the studio with protective wrapping and a final quality check.</p>
            </div>
            <div class="cart-hero-frame">
                <img src="assets/images/bowl.png" alt="" class="cart-hero-image">
            </div>
        </section>
        <section class="cart-right-panel">
            <header class="cart-header">
                <div>
                    <h3>Your Cart</h3>
                    <span class="cart-count-label" id="cart-count-label">0 items</span>
                </div>
                <button class="close-cart hover-target" id="close-cart-btn" aria-label="Close Cart">
                    <span>Close</span>
                    <span aria-hidden="true">&times;</span>
                </button>
            </header>
            <div class="cart-body" aria-live="polite"></div>
            <footer class="cart-footer">
                <div class="cart-total">
                    <span>Subtotal</span>
                    <strong>Rs 0.00</strong>
                </div>
                <a href="checkout.html" class="checkout-btn hover-target">
                    <span>Proceed to Checkout</span>
                    <span aria-hidden="true">→</span>
                </a>
            </footer>
        </section>
    </aside>
`;

export function injectCartShell() {
    if (document.getElementById('cart-drawer')) return;
    document.body.insertAdjacentHTML('afterbegin', CART_SHELL_HTML);
}
