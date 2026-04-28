import { loginAdmin } from './api.js';

const SECRET_WORD = 'miyaki';

function createSecretWordListener(onMatch) {
    let buffer = '';

    return (event) => {
        const tag = event.target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        buffer = (buffer + event.key).slice(-SECRET_WORD.length);
        if (buffer.toLowerCase() === SECRET_WORD) {
            buffer = '';
            onMatch();
        }
    };
}

export function initArchiveAdminAccess() {
    document.addEventListener('keydown', createSecretWordListener(() => {
        window.location.href = 'login.html';
    }));
}

export function initShopAdminAccess() {
    const overlay = document.getElementById('konami-overlay');
    const closeBtn = document.getElementById('konami-close');
    const form = document.getElementById('konami-login-form');

    if (!overlay || !closeBtn || !form) return;

    const usernameInput = document.getElementById('konami-username');
    const passwordInput = document.getElementById('konami-password');
    const errorEl = document.getElementById('konami-error');

    const closeOverlay = () => {
        overlay.classList.remove('is-active');
        errorEl.textContent = '';
        passwordInput.value = '';
    };

    const openOverlay = () => {
        overlay.classList.add('is-active');
        setTimeout(() => usernameInput?.focus(), 50);
    };

    document.addEventListener('keydown', createSecretWordListener(openOverlay));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && overlay.classList.contains('is-active')) {
            closeOverlay();
        }
    });

    closeBtn.addEventListener('click', closeOverlay);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorEl.textContent = '';

        try {
            await loginAdmin({
                username: usernameInput.value.trim(),
                password: passwordInput.value,
            });
            window.location.href = 'admin.html';
        } catch (error) {
            errorEl.textContent = error.message || 'Invalid credentials.';
            passwordInput.focus();
        }
    });
}
