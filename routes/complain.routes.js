const express = require("express");
const router = express.Router();
const complainController = require('../controllers/complain.controller');

router.post('/complains', complainController.complains);
router.get('/notifications', complainController.getNotifications);


module.exports = router;