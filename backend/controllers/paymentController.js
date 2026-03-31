const Razorpay = require('razorpay');
const crypto = require('crypto');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { AppError } = require('../middleware/errorHandler');

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new AppError('Payment gateway not configured. Contact admin.', 503);
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

/**
 * POST /api/payment/order
 * Create a Razorpay order for a paid course
 */
const createOrder = async (req, res, next) => {
  const { courseId } = req.body;
  if (!courseId) return next(new AppError('courseId is required.', 400));

  const course = await Course.findById(courseId);
  if (!course) return next(new AppError('Course not found.', 404));
  if (course.isFree || course.price === 0) {
    return next(new AppError('This course is free. No payment needed.', 400));
  }

  // Check already enrolled
  const existing = await Enrollment.findOne({ student: req.user._id, course: courseId });
  if (existing && existing.paymentStatus === 'completed') {
    return next(new AppError('You are already enrolled in this course.', 409));
  }

  const razorpay = getRazorpay();
  const amountInPaise = Math.round(course.price * 100); // Razorpay uses smallest currency unit

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
    notes: {
      courseId: course._id.toString(),
      courseName: course.title,
      studentId: req.user._id.toString(),
    },
  });

  // Create pending enrollment
  await Enrollment.findOneAndUpdate(
    { student: req.user._id, course: courseId },
    {
      student: req.user._id,
      course: courseId,
      paymentStatus: 'pending',
      orderId: order.id,
      amountPaid: course.price,
    },
    { upsert: true, new: true }
  );

  res.json({
    success: true,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      courseTitle: course.title,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
};

/**
 * POST /api/payment/verify
 * Verify Razorpay payment signature after checkout
 */
const verifyPayment = async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseId) {
    return next(new AppError('Missing payment verification fields.', 400));
  }

  // Verify signature
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const expectedSignature = hmac.digest('hex');

  if (expectedSignature !== razorpay_signature) {
    // Mark enrollment as failed
    await Enrollment.findOneAndUpdate(
      { student: req.user._id, course: courseId },
      { paymentStatus: 'failed' }
    );
    return next(new AppError('Payment verification failed. Please contact support.', 400));
  }

  // Mark enrollment as completed
  const enrollment = await Enrollment.findOneAndUpdate(
    { student: req.user._id, course: courseId },
    { paymentStatus: 'completed', paymentId: razorpay_payment_id },
    { new: true }
  );

  // Increment course student count
  await Course.findByIdAndUpdate(courseId, { $inc: { totalStudents: 1 } });

  res.json({
    success: true,
    message: 'Payment successful! You are now enrolled.',
    data: { enrollment },
  });
};

module.exports = { createOrder, verifyPayment };
