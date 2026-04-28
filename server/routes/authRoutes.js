const express = require('express');
const {
    handleAdminLogin,
    handleAdminLogout,
    handleAdminSession,
} = require('../middleware/auth');

const router = express.Router();

router.post('/login', handleAdminLogin);
router.post('/logout', handleAdminLogout);
router.get('/session', handleAdminSession);

module.exports = router;
