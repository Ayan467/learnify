const express = require('express');
const router = express.Router();
const {
  getCourses, getCourse, createCourse, updateCourse, deleteCourse,
  addLecture, getLectures, deleteLecture,
} = require('../controllers/courseController');
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');
const { uploadImage, uploadCourseFiles } = require('../config/multer');

router.get('/', optionalAuth, getCourses);
router.get('/:id', optionalAuth, getCourse);

router.post('/', protect, restrictTo('admin'), uploadImage.single('thumbnail'), createCourse);
router.put('/:id', protect, restrictTo('admin'), uploadImage.single('thumbnail'), updateCourse);
router.delete('/:id', protect, restrictTo('admin'), deleteCourse);

// Lecture sub-routes
router.get('/:id/lectures', protect, getLectures);
router.post('/:id/lectures', protect, restrictTo('admin'), uploadCourseFiles.single('video'), addLecture);
router.delete('/:id/lectures/:lectureId', protect, restrictTo('admin'), deleteLecture);

module.exports = router;
