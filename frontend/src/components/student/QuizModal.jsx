import { useState, useEffect } from 'react';
import { quizAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export default function QuizModal({ lectureId, courseId, onClose, onPass }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await quizAPI.get(lectureId);
        setQuiz(data.data);
      } catch {
        toast.error('No quiz for this lecture.');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [lectureId]);

  const handleSubmit = async () => {
    if (!quiz) return;
    const unanswered = quiz.questions.filter(q => answers[q._id] === undefined);
    if (unanswered.length > 0) {
      toast.error(`Please answer all ${quiz.questions.length} questions.`);
      return;
    }
    setSubmitting(true);
    try {
      const answersArr = quiz.questions.map(q => ({
        questionId: q._id,
        selectedOption: answers[q._id],
      }));
      const { data } = await quizAPI.submit(lectureId, { answers: answersArr, courseId });
      setResult(data.data);
      if (data.data.passed) {
        toast.success(`Great job! You scored ${data.data.score}%`);
        onPass?.();
      } else {
        toast.error(`You scored ${data.data.score}%. Need ${data.data.passingScore}% to pass.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-card w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="font-display font-bold text-xl text-white">Lecture Quiz</h2>
            {quiz && <p className="text-slate-500 text-sm mt-0.5">{quiz.questions?.length} questions · {quiz.passingScore}% to pass</p>}
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : result ? (
            /* Result view */
            <div className="space-y-6">
              {/* Score card */}
              <div className={`rounded-2xl p-6 text-center border ${result.passed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className={`text-5xl font-display font-bold mb-2 ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {result.score}%
                </div>
                <p className={`font-semibold ${result.passed ? 'text-emerald-300' : 'text-red-300'}`}>
                  {result.passed ? '🎉 Passed!' : '❌ Not passed'}
                </p>
                <p className="text-slate-500 text-sm mt-1">{result.correct} of {result.total} correct</p>
              </div>

              {/* Answer review */}
              {result.results?.map((r, i) => (
                <div key={r.questionId} className={`rounded-xl p-4 border ${r.isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                  <p className="text-sm font-medium text-white mb-3">
                    <span className="text-slate-500 mr-2">Q{i + 1}.</span>{r.question}
                  </p>
                  <div className="space-y-1.5">
                    {quiz.questions[i]?.options.map((opt, idx) => (
                      <div key={idx} className={`text-sm px-3 py-1.5 rounded-lg ${
                        idx === r.correctOption ? 'bg-emerald-500/20 text-emerald-300' :
                        idx === r.selectedOption && !r.isCorrect ? 'bg-red-500/20 text-red-300' :
                        'text-slate-500'
                      }`}>
                        {opt}
                        {idx === r.correctOption && <span className="ml-2 text-xs">✓ Correct</span>}
                        {idx === r.selectedOption && !r.isCorrect && <span className="ml-2 text-xs">✗ Your answer</span>}
                      </div>
                    ))}
                  </div>
                  {r.explanation && <p className="text-xs text-slate-500 mt-2 italic">💡 {r.explanation}</p>}
                </div>
              ))}

              <div className="flex gap-3">
                {!result.passed && (
                  <button onClick={() => { setResult(null); setAnswers({}); }} className="btn-secondary flex-1">
                    Retry Quiz
                  </button>
                )}
                <button onClick={onClose} className="btn-primary flex-1">
                  {result.passed ? 'Continue Learning' : 'Close'}
                </button>
              </div>
            </div>
          ) : (
            /* Quiz questions */
            <div className="space-y-6">
              {quiz?.questions.map((q, i) => (
                <div key={q._id} className="space-y-3">
                  <p className="font-medium text-white text-sm">
                    <span className="text-primary-400 font-bold mr-2">{i + 1}.</span>{q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, idx) => (
                      <button key={idx} onClick={() => setAnswers(prev => ({ ...prev, [q._id]: idx }))}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                          answers[q._id] === idx
                            ? 'border-primary-500/60 bg-primary-500/10 text-white'
                            : 'border-white/5 bg-white/3 text-slate-400 hover:border-white/15 hover:text-white'
                        }`}>
                        <span className={`inline-block w-5 h-5 rounded-full border text-xs mr-3 text-center leading-5 ${
                          answers[q._id] === idx ? 'border-primary-400 bg-primary-500 text-white' : 'border-white/20'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-2 flex gap-3">
                <button onClick={onClose} className="btn-secondary">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Submitting...' : `Submit Quiz (${Object.keys(answers).length}/${quiz?.questions.length})`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const Spinner = () => (
  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
);
