export const CURRENCY_LABEL = 'Rs';
export const CURRENCY_CODE = 'INR';

export function parseCurrency(value) {
    const numeric = parseFloat(String(value ?? '').replace(/[^0-9.-]+/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
}

export function formatCurrency(value) {
    return `${CURRENCY_LABEL} ${parseCurrency(value).toFixed(2)}`;
}
