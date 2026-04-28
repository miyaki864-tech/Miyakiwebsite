import { fetchAdminSession, loginAdmin } from './api.js';

export async function initLogin() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    if (await fetchAdminSession()) {
        window.location.href = 'admin.html';
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const errorDiv = document.getElementById('error-message');
        const submitBtn = document.getElementById('submitBtn');

        submitBtn.textContent = 'Verifying...';
        submitBtn.disabled = true;
        errorDiv.textContent = '';

        try {
            await loginAdmin({
                username: document.getElementById('username').value.trim(),
                password: document.getElementById('password').value,
            });
            window.location.href = 'admin.html';
        } catch (error) {
            errorDiv.textContent = error.message || 'Invalid credentials. Please try again.';
            submitBtn.textContent = 'Sign In';
            submitBtn.disabled = false;
        }
    });
}
