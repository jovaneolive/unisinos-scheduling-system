const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// SAML routes
router.get('/saml', authController.samlLogin.bind(authController));
router.post('/saml/callback', authController.samlCallback.bind(authController));
router.get('/saml/success', authController.samlSuccess.bind(authController));
router.get('/saml/failure', authController.samlFailure.bind(authController));

// Token verification (protected)
router.get('/verify', authMiddleware, authController.verifyToken.bind(authController));

// Logout
router.post('/logout', authMiddleware, authController.logout.bind(authController));

module.exports = router; 