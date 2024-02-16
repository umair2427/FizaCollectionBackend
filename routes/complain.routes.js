const express = require("express");
const router = express.Router();
const complainController = require('../controllers/complain.controller');

router.post('/complains', complainController.complains)


module.exports = router;