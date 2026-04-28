const crypto = require('crypto');
const {
    ADMIN_COOKIE_NAME,
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
} = require('../config');

const activeAdminSessions = new Set();

function parseCookies(req) {
    return (req.headers.cookie || '')
        .split(';')
        .map((cookie) => cookie.trim())
        .filter(Boolean)
        .reduce((acc, cookie) => {
            const separatorIndex = cookie.indexOf('=');
            const key = separatorIndex >= 0 ? cookie.slice(0, separatorIndex) : cookie;
            const value = separatorIndex >= 0 ? cookie.slice(separatorIndex + 1) : '';
            acc[key] = decodeURIComponent(value);
            return acc;
        }, {});
}

function getAdminToken(req) {
    return parseCookies(req)[ADMIN_COOKIE_NAME] || '';
}

function isAdminAuthenticated(req) {
    return activeAdminSessions.has(getAdminToken(req));
}

function setAdminCookie(res, token) {
    res.setHeader(
        'Set-Cookie',
        `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax`
    );
}

function clearAdminCookie(res) {
    res.setHeader(
        'Set-Cookie',
        `${ADMIN_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
    );
}

function requireAdminPage(req, res, next) {
    if (isAdminAuthenticated(req)) return next();
    return res.redirect('/login.html');
}

function requireAdminApi(req, res, next) {
    if (isAdminAuthenticated(req)) return next();
    return res.status(401).json({ error: 'Unauthorized' });
}

function handleAdminLogin(req, res) {
    const { username = '', password = '' } = req.body || {};

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    activeAdminSessions.add(token);
    setAdminCookie(res, token);
    return res.json({ message: 'success' });
}

function handleAdminLogout(req, res) {
    const token = getAdminToken(req);
    activeAdminSessions.delete(token);
    clearAdminCookie(res);
    return res.json({ message: 'success' });
}

function handleAdminSession(req, res) {
    return res.json({ authenticated: isAdminAuthenticated(req) });
}

module.exports = {
    handleAdminLogin,
    handleAdminLogout,
    handleAdminSession,
    requireAdminApi,
    requireAdminPage,
};
