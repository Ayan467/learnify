const Quiz = require('../models/Quiz');
const Enrollment = require('../models/Enrollment');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/quiz/:lectureId
 * Get quiz for a lecture (students see questions without correct answers)
 */
const getQuiz = async (req, res, next) => {
  const quiz = await Quiz.findOne({ lecture: req.params.lectureId });
  if (!quiz) return next(new AppError('No quiz found for this lecture.', 404));

  // Strip correct answers for students
  const safeQuestions = quiz.questions.map((q) => ({
    _id: q._id,
    question: q.question,
    options: q.options,
  }));

  res.json({
    success: true,
    data: { quizId: quiz._id, lectureId: quiz.lecture, passingScore: quiz.passingScore, questions: safeQuestions },
  });
};

/**
 * POST /api/quiz/:lectureId/submit
 * Submit quiz answers
 */
const submitQuiz = async (req, res, next) => {
  const { answers, courseId } = req.body; // answers: [{ questionId, selectedOption }]
  if (!answers || !Array.isArray(answers)) {
    return next(new AppError('answers array is required.', 400));
  }

  const quiz = await Quiz.findOne({ lecture: req.params.lectureId });
  if (!quiz) return next(new AppError('Quiz not found.', 404));

  // Grade
  let correct = 0;
  const results = quiz.questions.map((q) => {
    const answer = answers.find((a) => a.questionId === q._id.toString());
    const isCorrect = answer && answer.selectedOption === q.correctOption;
    if (isCorrect) correct++;
    return {
      questionId: q._id,
      question: q.question,
      selectedOption: answer?.selectedOption ?? null,
      correctOption: q.correctOption,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const score = Math.round((correct / quiz.questions.length) * 100);
  const passed = score >= quiz.passingScore;

  // Save to enrollment if courseId provided
  if (courseId) {
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (enrollment) {
      const existingIdx = enrollment.quizScores.findIndex(
        (s) => s.lecture.toString() === req.params.lectureId
      );
      const scoreEntry = { lecture: req.params.lectureId, score, passed, attemptedAt: new Date() };
      if (existingIdx >= 0) {
        enrollment.quizScores[existingIdx] = scoreEntry;
      } else {
        enrollment.quizScores.push(scoreEntry);
      }
      await enrollment.save({ validateBeforeSave: false });
    }
  }

  res.json({
    success: true,
    data: { score, passed, correct, total: quiz.questions.length, passingScore: quiz.passingScore, results },
  });
};

/**
 * POST /api/quiz/:lectureId
 * Create or update quiz (admin only)
 */
const createOrUpdateQuiz = async (req, res, next) => {
  const { courseId, questions, passingScore } = req.body;

  if (!courseId || !questions || !Array.isArray(questions) || questions.length === 0) {
    return next(new AppError('courseId and questions[] are required.', 400));
  }

  // Validate each question
  for (const q of questions) {
    if (!q.question || !q.options || q.options.length !== 4 || q.correctOption === undefined) {
      return next(new AppError('Each question must have text, exactly 4 options, and a correctOption (0-3).', 400));
    }
  }

  const quiz = await Quiz.findOneAndUpdate(
    { lecture: req.params.lectureId },
    { lecture: req.params.lectureId, course: courseId, questions, passingScore: passingScore || 60 },
    { upsert: true, new: true, runValidators: true }
  );

  res.status(201).json({ success: true, message: 'Quiz saved!', data: { quiz } });
};

/**
 * DELETE /api/quiz/:lectureId
 * Delete quiz (admin only)
 */
const deleteQuiz = async (req, res, next) => {
  const quiz = await Quiz.findOneAndDelete({ lecture: req.params.lectureId });
  if (!quiz) return next(new AppError('Quiz not found.', 404));
  res.json({ success: true, message: 'Quiz deleted.' });
};

module.exports = { getQuiz, submitQuiz, createOrUpdateQuiz, deleteQuiz };
