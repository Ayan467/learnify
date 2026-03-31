const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lecture = require('../models/Lecture');
const { AppError } = require('../middleware/errorHandler');
const { generateCertificate } = require('../utils/certificate');

/**
 * POST /api/enrollments
 * Enroll in a free course
 */
const enroll = async (req, res, next) => {
  const { courseId } = req.body;
  if (!courseId) return next(new AppError('courseId is required.', 400));

  const course = await Course.findById(courseId);
  if (!course) return next(new AppError('Course not found.', 404));

  if (!course.isFree && course.price > 0) {
    return next(new AppError('This is a paid course. Please complete payment first.', 400));
  }

  const existing = await Enrollment.findOne({ student: req.user._id, course: courseId });
  if (existing) {
    return next(new AppError('You are already enrolled in this course.', 409));
  }

  const enrollment = await Enrollment.create({
    student: req.user._id,
    course: courseId,
    paymentStatus: 'free',
  });

  // Increment totalStudents
  await Course.findByIdAndUpdate(courseId, { $inc: { totalStudents: 1 } });

  res.status(201).json({ success: true, message: 'Enrolled successfully!', data: { enrollment } });
};

/**
 * GET /api/enrollments/my
 * Get current student's enrollments
 */
const getMyEnrollments = async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .populate({ path: 'course', populate: { path: 'instructor', select: 'name' } })
    .sort('-createdAt');

  res.json({ success: true, data: { enrollments } });
};

/**
 * GET /api/enrollments/:courseId
 * Get enrollment details for a specific course
 */
const getEnrollment = async (req, res, next) => {
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
  }).populate('completedLectures');

  if (!enrollment) return next(new AppError('Enrollment not found.', 404));

  res.json({ success: true, data: { enrollment } });
};

/**
 * POST /api/enrollments/:courseId/progress
 * Mark a lecture as completed
 */
const updateProgress = async (req, res, next) => {
  const { lectureId } = req.body;
  if (!lectureId) return next(new AppError('lectureId is required.', 400));

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
  });
  if (!enrollment) return next(new AppError('Enrollment not found.', 404));

  // Add lecture if not already completed
  if (!enrollment.completedLectures.map(String).includes(lectureId)) {
    enrollment.completedLectures.push(lectureId);
  }

  // Recalculate progress
  const totalLectures = await Lecture.countDocuments({ course: req.params.courseId });
  enrollment.progressPercent = totalLectures > 0
    ? Math.round((enrollment.completedLectures.length / totalLectures) * 100)
    : 0;

  if (enrollment.progressPercent === 100) {
    enrollment.isCompleted = true;
    enrollment.completedAt = new Date();
  }

  await enrollment.save();

  res.json({ success: true, data: { enrollment } });
};

/**
 * GET /api/enrollments/:courseId/certificate
 * Generate and download course completion certificate
 */
const getCertificate = async (req, res, next) => {
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
  }).populate('course');

  if (!enrollment) return next(new AppError('Enrollment not found.', 404));
  if (!enrollment.isCompleted) {
    return next(new AppError('You must complete the course before claiming your certificate.', 400));
  }

  try {
    const pdfBuffer = await generateCertificate({
      studentName: req.user.name,
      courseName: enrollment.course.title,
      completedAt: enrollment.completedAt || new Date(),
      courseId: enrollment.course._id.toString(),
    });

    // Mark certificate as generated
    enrollment.certificateGenerated = true;
    await enrollment.save({ validateBeforeSave: false });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificate-${enrollment.course.title.replace(/\s+/g, '-')}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (err) {
    next(new AppError('Failed to generate certificate. Please try again.', 500));
  }
};

/**
 * GET /api/enrollments/admin/all
 * Admin: get all enrollments
 */
const getAllEnrollments = async (req, res) => {
  const enrollments = await Enrollment.find()
    .populate('student', 'name email')
    .populate('course', 'title price')
    .sort('-createdAt')
    .limit(100);

  res.json({ success: true, data: { enrollments } });
};

module.exports = { enroll, getMyEnrollments, getEnrollment, updateProgress, getCertificate, getAllEnrollments };
