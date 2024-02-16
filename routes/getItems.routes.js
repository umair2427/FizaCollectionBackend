const express = require("express");
const router = express.Router();
const itemsController = require('../controllers/getItems.controller');
const firebaseMiddleware = require("../middleware/firebaseAuth.middleware");

router.get('/getCategories',
    // firebaseMiddleware.verifyTokenMiddleware, 
    itemsController.getCategories)
router.get(
    '/getColors',
    // firebaseMiddleware.verifyTokenMiddleware, 
    itemsController.getColors)
router.get(
    '/getDeliveryStatus',
    // firebaseMiddleware.verifyTokenMiddleware, 
    itemsController.getDeliveryStatus)
router.get(
    '/getPaymentMethod',
    // firebaseMiddleware.verifyTokenMiddleware, 
    itemsController.getPaymentMethod)
router.get(
    '/getStatus',
    // firebaseMiddleware.verifyTokenMiddleware, 
    itemsController.getStatus)
router.post(
    '/befriend',
    // firebaseMiddleware.verifyTokenMiddleware, 
    itemsController.beFriend)

module.exports = router;