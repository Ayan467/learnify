const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

/**
 * GET /api/admin/stats
 * Dashboard analytics
 */
const getStats = async (req, res) => {
  const [totalStudents, totalCourses, totalEnrollments, recentEnrollments, revenueData] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Course.countDocuments({ isPublished: true }),
    Enrollment.countDocuments(),
    Enrollment.find()
      .populate('student', 'name email')
      .populate('course', 'title price')
      .sort('-createdAt')
      .limit(10),
    Enrollment.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]),
  ]);

  const totalRevenue = revenueData[0]?.total || 0;

  // Enrollments per course (top 5)
  const topCourses = await Enrollment.aggregate([
    { $group: { _id: '$course', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'courses', localField: '_id', foreignField: '_id', as: 'course' } },
    { $unwind: '$course' },
    { $project: { title: '$course.title', count: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      stats: { totalStudents, totalCourses, totalEnrollments, totalRevenue },
      recentEnrollments,
      topCourses,
    },
  });
};

/**
 * GET /api/admin/students
 */
const getStudents = async (req, res) => {
  const students = await User.find({ role: 'student' }).sort('-createdAt').select('-password -refreshToken');
  res.json({ success: true, data: { students } });
};

/**
 * PATCH /api/admin/students/:id/toggle
 * Activate / deactivate student account
 */
const toggleStudent = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'student') {
    return res.status(404).json({ success: false, message: 'Student not found.' });
  }
  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: `Student ${user.isActive ? 'activated' : 'deactivated'}.`, data: { user } });
};

module.exports = { getStats, getStudents, toggleStudent };
