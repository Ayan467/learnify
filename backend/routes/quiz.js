const express = require('express');
const router = express.Router();
const { getQuiz, submitQuiz, createOrUpdateQuiz, deleteQuiz } = require('../controllers/quizController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/:lectureId', protect, getQuiz);
router.post('/:lectureId/submit', protect, restrictTo('student'), submitQuiz);
router.post('/:lectureId', protect, restrictTo('admin'), createOrUpdateQuiz);
router.delete('/:lectureId', protect, restrictTo('admin'), deleteQuiz);

module.exports = router;
