// routes/chat.js
const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, getConversations, getUnreadCount } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/conversations', protect, getConversations);
router.get('/unread-count', protect, getUnreadCount);
router.get('/messages/:userId', protect, getMessages);
router.post('/messages', protect, sendMessage);

module.exports = router;
