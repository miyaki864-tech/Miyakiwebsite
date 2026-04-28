const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

module.exports = {
    PORT: Number(process.env.PORT) || 3000,
    ROOT_DIR,
    DB_PATH: path.join(ROOT_DIR, 'miyaki.db'),
    UPLOAD_DIR: path.join(ROOT_DIR, 'assets', 'images', 'uploads'),
    PUBLIC_UPLOAD_DIR: 'assets/images/uploads',
    DEFAULT_PRODUCT_IMAGE: 'assets/images/vases.png',
    ADMIN_COOKIE_NAME: 'miyaki_admin',
    ADMIN_USERNAME: process.env.MIYAKI_ADMIN_USER || 'Aarka',
    ADMIN_PASSWORD: process.env.MIYAKI_ADMIN_PASS || 'Kolkata@3',
};
