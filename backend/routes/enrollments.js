// routes/enrollments.js
const express = require('express');
const router = express.Router();
const { enroll, getMyEnrollments, getEnrollment, updateProgress, getCertificate, getAllEnrollments } = require('../controllers/enrollmentController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/', protect, restrictTo('student'), enroll);
router.get('/my', protect, restrictTo('student'), getMyEnrollments);
router.get('/admin/all', protect, restrictTo('admin'), getAllEnrollments);
router.get('/:courseId', protect, getEnrollment);
router.post('/:courseId/progress', protect, restrictTo('student'), updateProgress);
router.get('/:courseId/certificate', protect, restrictTo('student'), getCertificate);

module.exports = router;
