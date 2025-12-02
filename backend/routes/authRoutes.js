const express = require('express');
const { login, getMe, setupAdmin } = require('../controllers/authController');

const router = express.Router();

// Routes
router.post('/login', login);
router.get('/me', getMe);
router.post('/setup', setupAdmin);

module.exports = router;