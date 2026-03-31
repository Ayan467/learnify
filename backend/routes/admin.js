const express = require('express');
const router = express.Router();
const { getStats, getStudents, toggleStudent } = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('admin'));

router.get('/stats', getStats);
router.get('/students', getStudents);
router.patch('/students/:id/toggle', toggleStudent);

module.exports = router;
