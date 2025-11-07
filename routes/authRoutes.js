const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validation');

// Login route with validation
router.post('/login', validateLogin, authController.login);

// Debug endpoint to test without validation (for troubleshooting)
router.post('/login-debug', authController.login);

router.post('/verify-token', authenticateToken, authController.verifyToken);

module.exports = router;