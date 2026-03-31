const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: {
    type: [String],
    required: true,
    validate: [(arr) => arr.length === 4, 'Exactly 4 options required'],
  },
  correctOption: {
    type: Number, // index 0-3
    required: true,
    min: 0,
    max: 3,
  },
  explanation: { type: String, default: '' },
});

const quizSchema = new mongoose.Schema(
  {
    lecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture',
      required: true,
      unique: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    questions: {
      type: [questionSchema],
      validate: [(arr) => arr.length >= 1, 'At least 1 question required'],
    },
    passingScore: {
      type: Number,
      default: 60, // percent
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
