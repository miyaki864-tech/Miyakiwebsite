export const MOBILE_BREAKPOINT = 768;

export function isMobileViewport(width = window.innerWidth) {
    return width <= MOBILE_BREAKPOINT;
}

export function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[char]));
}

export function normalizeAssetPath(value = '') {
    const path = String(value || '').trim();
    if (!path) return '';
    if (/^(?:[a-z][a-z\d+\-.]*:|\/\/)/i.test(path)) return path;
    return `/${path.replace(/^\/+/, '')}`;
}
