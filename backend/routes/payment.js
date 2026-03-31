const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/order', protect, restrictTo('student'), createOrder);
router.post('/verify', protect, restrictTo('student'), verifyPayment);

module.exports = router;
