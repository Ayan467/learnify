const Chat = require('../models/Chat');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/chat/messages/:userId
 * Get conversation between current user and another user
 */
const getMessages = async (req, res, next) => {
  const otherUserId = req.params.userId;

  const messages = await Chat.find({
    $or: [
      { sender: req.user._id, receiver: otherUserId },
      { sender: otherUserId, receiver: req.user._id },
    ],
  })
    .sort('createdAt')
    .populate('sender', 'name avatar role')
    .populate('receiver', 'name avatar role')
    .limit(100);

  // Mark messages as read
  await Chat.updateMany(
    { sender: otherUserId, receiver: req.user._id, isRead: false },
    { isRead: true }
  );

  res.json({ success: true, data: { messages } });
};

/**
 * POST /api/chat/messages
 * Send a message (REST fallback — primary flow uses Socket.io)
 */
const sendMessage = async (req, res, next) => {
  const { receiverId, message } = req.body;

  if (!receiverId || !message?.trim()) {
    return next(new AppError('receiverId and message are required.', 400));
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) return next(new AppError('Receiver not found.', 404));

  const chat = await Chat.create({
    sender: req.user._id,
    receiver: receiverId,
    message: message.trim(),
  });

  const populated = await chat.populate([
    { path: 'sender', select: 'name avatar role' },
    { path: 'receiver', select: 'name avatar role' },
  ]);

  res.status(201).json({ success: true, data: { message: populated } });
};

/**
 * GET /api/chat/conversations
 * Admin: get list of all students who have sent messages
 */
const getConversations = async (req, res) => {
  const messages = await Chat.aggregate([
    {
      $match: {
        $or: [{ sender: req.user._id }, { receiver: req.user._id }],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [{ $eq: ['$sender', req.user._id] }, '$receiver', '$sender'],
        },
        lastMessage: { $first: '$message' },
        lastAt: { $first: '$createdAt' },
        unread: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$receiver', req.user._id] }, { $eq: ['$isRead', false] }] }, 1, 0],
          },
        },
      },
    },
    { $sort: { lastAt: -1 } },
  ]);

  // Populate user info
  const populated = await User.populate(messages, { path: '_id', select: 'name avatar role lastSeen' });

  res.json({ success: true, data: { conversations: populated } });
};

/**
 * GET /api/chat/unread-count
 */
const getUnreadCount = async (req, res) => {
  const count = await Chat.countDocuments({ receiver: req.user._id, isRead: false });
  res.json({ success: true, data: { count } });
};

module.exports = { getMessages, sendMessage, getConversations, getUnreadCount };
