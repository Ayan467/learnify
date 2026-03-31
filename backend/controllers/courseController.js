const Course = require('../models/Course');
const Lecture = require('../models/Lecture');
const Enrollment = require('../models/Enrollment');
const { AppError } = require('../middleware/errorHandler');
const path = require('path');

/**
 * GET /api/courses
 * List all published courses (with optional filters)
 */
const getCourses = async (req, res) => {
  const { category, level, isFree, search, page = 1, limit = 12 } = req.query;

  const filter = { isPublished: true };
  if (category) filter.category = category;
  if (level) filter.level = level;
  if (isFree !== undefined) filter.isFree = isFree === 'true';
  if (search) filter.$text = { $search: search };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate('instructor', 'name avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit)),
    Course.countDocuments(filter),
  ]);

  // Attach lecture count
  const coursesWithCount = await Promise.all(
    courses.map(async (c) => {
      const lectureCount = await Lecture.countDocuments({ course: c._id });
      return { ...c.toJSON(), lectureCount };
    })
  );

  res.json({
    success: true,
    data: {
      courses: coursesWithCount,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    },
  });
};

/**
 * GET /api/courses/:id
 * Get single course with lectures
 */
const getCourse = async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate('instructor', 'name avatar email');
  if (!course) return next(new AppError('Course not found.', 404));

  const lectures = await Lecture.find({ course: course._id }).sort('order').select('-__v');

  // Check if current user is enrolled
  let enrollment = null;
  if (req.user) {
    enrollment = await Enrollment.findOne({ student: req.user._id, course: course._id });
  }

  res.json({ success: true, data: { course, lectures, enrollment } });
};

/**
 * POST /api/courses
 * Create course (admin only)
 */
const createCourse = async (req, res, next) => {
  const { title, description, price, isFree, category, level, tags } = req.body;

  if (!title || !description || !category) {
    return next(new AppError('Title, description, and category are required.', 400));
  }

  const thumbnail = req.file ? `/uploads/thumbnails/${req.file.filename}` : null;

  const course = await Course.create({
    title,
    description,
    price: isFree === 'true' ? 0 : parseFloat(price) || 0,
    isFree: isFree === 'true',
    category,
    level: level || 'Beginner',
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    thumbnail,
    instructor: req.user._id,
    isPublished: true,
  });

  res.status(201).json({ success: true, message: 'Course created!', data: { course } });
};

/**
 * PUT /api/courses/:id
 * Update course (admin only)
 */
const updateCourse = async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new AppError('Course not found.', 404));

  const { title, description, price, isFree, category, level, tags, isPublished } = req.body;
  if (title) course.title = title;
  if (description) course.description = description;
  if (category) course.category = category;
  if (level) course.level = level;
  if (tags) course.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
  if (isPublished !== undefined) course.isPublished = isPublished === 'true';
  if (isFree !== undefined) {
    course.isFree = isFree === 'true';
    course.price = course.isFree ? 0 : parseFloat(price) || course.price;
  }
  if (req.file) course.thumbnail = `/uploads/thumbnails/${req.file.filename}`;

  await course.save();
  res.json({ success: true, message: 'Course updated!', data: { course } });
};

/**
 * DELETE /api/courses/:id
 * Delete course + all its lectures (admin only)
 */
const deleteCourse = async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new AppError('Course not found.', 404));

  await Promise.all([
    Lecture.deleteMany({ course: course._id }),
    Enrollment.deleteMany({ course: course._id }),
    course.deleteOne(),
  ]);

  res.json({ success: true, message: 'Course deleted successfully.' });
};

/**
 * POST /api/courses/:id/lectures
 * Add lecture to a course (admin only)
 */
const addLecture = async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new AppError('Course not found.', 404));

  const { title, description, youtubeUrl, isFreePreview } = req.body;
  if (!title) return next(new AppError('Lecture title is required.', 400));

  const lastLecture = await Lecture.findOne({ course: course._id }).sort('-order');
  const order = lastLecture ? lastLecture.order + 1 : 1;

  const videoUrl = req.file ? `/uploads/videos/${req.file.filename}` : null;

  const lecture = await Lecture.create({
    title,
    description: description || '',
    course: course._id,
    videoUrl,
    youtubeUrl: youtubeUrl || null,
    isFreePreview: isFreePreview === 'true',
    order,
  });

  res.status(201).json({ success: true, message: 'Lecture added!', data: { lecture } });
};

/**
 * GET /api/courses/:id/lectures
 */
const getLectures = async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) return next(new AppError('Course not found.', 404));

  const lectures = await Lecture.find({ course: course._id }).sort('order');
  res.json({ success: true, data: { lectures } });
};

/**
 * DELETE /api/courses/:courseId/lectures/:lectureId
 */
const deleteLecture = async (req, res, next) => {
  const lecture = await Lecture.findOneAndDelete({
    _id: req.params.lectureId,
    course: req.params.id,
  });
  if (!lecture) return next(new AppError('Lecture not found.', 404));
  res.json({ success: true, message: 'Lecture deleted.' });
};

module.exports = { getCourses, getCourse, createCourse, updateCourse, deleteCourse, addLecture, getLectures, deleteLecture };
