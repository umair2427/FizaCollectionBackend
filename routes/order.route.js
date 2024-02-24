const express = require("express");
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require("../middleware/auth.middleware");

router.post(
    '/order',
    // authMiddleware.checkIfAuthenticated,
    orderController.createOrder);
router.get(
    '/getUserOrders',
    authMiddleware.checkIfAuthenticated,
    orderController.getAllUserOrderItems
    );

router.get(
    '/getOrders',
    // authMiddleware.checkIfAuthenticated,
    orderController.getAllOrderItems
    );

router.get(
    '/singleOrder/:id',
    orderController.getSingleOrder
    );

router.delete(
    '/deleteOrder/:id',
    orderController.deleteOrder
    );

router.post(
    '/orders/delete-multiple',
    orderController.deleteMultipleOrders
    );


module.exports = router;