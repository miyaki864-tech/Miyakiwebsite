# CSS Architecture

This project uses plain CSS only. There is no build step: page-level entrypoints import small modules directly.

## Entrypoints

- `styles.css` is the storefront entrypoint for home, shop/product, archive, cart, and the mobile shell.
- `checkout.css` is the checkout and tracking entrypoint.
- `admin.css` is the admin dashboard entrypoint.
- `login.css` is the employee login entrypoint.

## Module Order

Imports intentionally preserve the old cascade order. When moving or editing styles, keep base/shared rules before page/component rules, and keep mobile overrides after their matching desktop/base modules.

## Desktop and Mobile

Desktop/base rules live in the component or page module by default. Mobile-specific rules live in `mobile.css` or `responsive.css` modules, for example `pages/shop/mobile.css`, `components/product/panel-mobile.css`, `pages/archive/responsive.css`, `pages/checkout/mobile.css`, and `pages/admin/mobile.css`.

For future changes, edit the base/desktop module first, then place viewport-specific differences in the matching mobile module. This keeps both versions available as separate options without changing the static CSS entrypoints.

## Inline Styles

HTML and JS templates should use named classes rather than `style=""` attributes. Page-only classes belong in the relevant `pages/*` module, reusable controls belong in `components/*`, and hidden/active state should generally be expressed with classes such as `.is-hidden` or `.is-active`.

## Rules

- Preserve existing class names and IDs when JavaScript depends on them.
- Prefer adding named classes over new inline styles.
- Do not introduce Sass, Tailwind, CSS Modules, or a bundler.
- Avoid visual changes during refactors; verify in browser after moving styles.
