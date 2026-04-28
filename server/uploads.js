const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { PUBLIC_UPLOAD_DIR, UPLOAD_DIR } = require('./config');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const uploadProductImage = multer({
    storage,
    limits: { fileSize: 5_000_000 },
}).single('productImage');

function toPublicUploadPath(filename) {
    return path.posix.join(PUBLIC_UPLOAD_DIR, filename);
}

module.exports = {
    toPublicUploadPath,
    uploadProductImage,
};
