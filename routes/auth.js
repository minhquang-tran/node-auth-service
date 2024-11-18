// routes/auth.js
const express = require('express');
const authController = require('../controllers/auth');

const router = express.Router();

router.post('/sign-up', authController.signUp);
router.post('/sign-in', authController.signIn);
router.post('/sign-out', authController.signOut);
router.post('/refresh-token', authController.refreshToken);

// Protected route example for testing token validation
router.get('/protected', authController.authenticate, (req, res) => {
    res.send('This is a protected route');
});

module.exports = router;