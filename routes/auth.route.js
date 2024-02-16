const express = require("express");
const router = express.Router();
const authController = require('../controllers/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgetPassword', authController.forgotPassword);
router.post('/resetPassword/:token', authController.resetPassword);

module.exports = router;