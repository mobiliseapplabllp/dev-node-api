
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

router.post('/addUser', userController.addUser);

router.post('/getAllUsers', authenticateToken, userController.getAllUsers);

router.get('/profile', authenticateToken, userController.getUserProfile);

router.get('/:id', authenticateToken, userController.getUserById);

router.put('/updatePassword', authenticateToken, userController.updatePassword);

module.exports = router;