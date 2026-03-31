import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseAPI } from '../utils/api';
import { useCourse } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import QuizModal from '../components/student/QuizModal';
import toast from 'react-hot-toast';

export default function LearnPage() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const { getEnrollment, updateProgress, downloadCertificate, fetchMyEnrollments } = useCourse();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [activeLec, setActiveLec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quizOpen, setQuizOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await courseAPI.getOne(courseId);
        setCourse(data.data.course);
        setLectures(data.data.lectures);
        setActiveLec(data.data.lectures[0] || null);
        await fetchMyEnrollments();
      } catch {
        toast.error('Failed to load course.');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const enrollment = getEnrollment(courseId);
  const isCompleted = (lecId) => enrollment?.completedLectures?.map(String).includes(String(lecId));

  const handleLectureComplete = async () => {
    if (!activeLec || isCompleted(activeLec._id)) return;
    try {
      const updated = await updateProgress(courseId, activeLec._id);
      if (updated.progressPercent === 100) {
        toast.success('🏆 Course completed! Your certificate is ready.');
      } else {
        toast.success('Lecture marked as complete!');
      }
    } catch { toast.error('Failed to update progress.'); }
  };

  const getYouTubeId = (url) => {
    const match = url?.match(/(?:embed\/|v=|youtu\.be\/)([^&?/]+)/);
    return match?.[1];
  };

  if (loading) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!course) return null;

  const progress = enrollment?.progressPercent || 0;
  const completedCount = enrollment?.completedLectures?.length || 0;

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Top bar */}
      <div className="h-14 glass border-b border-white/5 flex items-center px-4 gap-4 z-30 fixed top-0 left-0 right-0">
        <Link to="/dashboard" className="text-slate-500 hover:text-white transition-colors">
          <BackIcon />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-white text-sm truncate">{course.title}</p>
        </div>
        {/* Progress bar in topbar */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs text-slate-500">{completedCount}/{lectures.length}</span>
          <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-primary-400 font-medium">{progress}%</span>
        </div>

        <button onClick={() => setSidebarOpen(p => !p)}
          className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
          <SidebarIcon />
        </button>
      </div>

      <div className="flex flex-1 pt-14">
        {/* Video area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Video player */}
          <div className="bg-black relative" style={{ aspectRatio: '16/9', maxHeight: '65vh' }}>
            {activeLec ? (
              activeLec.youtubeUrl ? (
                <iframe
                  src={`${activeLec.youtubeUrl}?rel=0&modestbranding=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : activeLec.videoUrl ? (
                <video ref={videoRef} src={activeLec.videoUrl} controls className="w-full h-full"
                  onEnded={handleLectureComplete}>
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                  <VideoOffIcon />
                  <p className="mt-3 text-sm">No video available for this lecture</p>
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600">
                <p>Select a lecture to start</p>
              </div>
            )}
          </div>

          {/* Lecture info + actions */}
          {activeLec && (
            <div className="p-6 border-b border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <h2 className="font-display text-xl font-bold text-white mb-1">{activeLec.title}</h2>
                  {activeLec.description && <p className="text-slate-500 text-sm leading-relaxed">{activeLec.description}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {/* YouTube link */}
                  {activeLec.youtubeUrl && (
                    <a href={activeLec.youtubeUrl.replace('/embed/', '/watch?v=')} target="_blank" rel="noopener noreferrer"
                      className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5">
                      <YoutubeIcon />
                      <span>YouTube</span>
                    </a>
                  )}
                  {/* Quiz */}
                  <button onClick={() => setQuizOpen(true)} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5">
                    <QuizIcon />
                    <span>Quiz</span>
                  </button>
                  {/* Mark complete */}
                  <button onClick={handleLectureComplete} disabled={isCompleted(activeLec._id)}
                    className={`text-sm py-2 px-4 rounded-xl flex items-center gap-1.5 transition-colors ${
                      isCompleted(activeLec._id)
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 cursor-default'
                        : 'btn-primary'
                    }`}>
                    {isCompleted(activeLec._id) ? '✓ Completed' : 'Mark Complete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Certificate section */}
          {enrollment?.isCompleted && (
            <div className="p-6">
              <div className="glass-card p-5 flex items-center gap-4 border-emerald-500/20 bg-emerald-500/5">
                <div className="text-3xl">🏆</div>
                <div className="flex-1">
                  <p className="font-display font-semibold text-emerald-400">Course Completed!</p>
                  <p className="text-slate-500 text-sm">Download your certificate of completion.</p>
                </div>
                <button onClick={() => downloadCertificate(courseId, course.title)} className="btn-primary text-sm py-2">
                  Download Certificate
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lecture sidebar */}
        {sidebarOpen && (
          <div className="w-72 xl:w-80 border-l border-white/5 bg-dark-800 overflow-y-auto flex-shrink-0">
            <div className="p-4 border-b border-white/5">
              <p className="text-sm font-medium text-slate-400">Course Content</p>
              <p className="text-xs text-slate-600 mt-0.5">{completedCount} of {lectures.length} completed</p>
            </div>
            <div className="py-2">
              {lectures.map((lec, i) => {
                const done = isCompleted(lec._id);
                const active = activeLec?._id === lec._id;
                return (
                  <button key={lec._id} onClick={() => setActiveLec(lec)}
                    className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors ${
                      active ? 'bg-primary-600/10 border-r-2 border-primary-500' :
                      'hover:bg-white/3'
                    }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                      done ? 'bg-emerald-500/20 text-emerald-400' :
                      active ? 'bg-primary-500/20 text-primary-400' :
                      'bg-white/5 text-slate-500'
                    }`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${active ? 'text-white font-medium' : done ? 'text-slate-400' : 'text-slate-300'}`}>
                        {lec.title}
                      </p>
                      {lec.isFreePreview && (
                        <span className="text-xs text-emerald-400 mt-0.5 inline-block">Free preview</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      {quizOpen && activeLec && (
        <QuizModal
          lectureId={activeLec._id}
          courseId={courseId}
          onClose={() => setQuizOpen(false)}
          onPass={() => { setQuizOpen(false); handleLectureComplete(); }}
        />
      )}
    </div>
  );
}

const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
const SidebarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);
const YoutubeIcon = () => (
  <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
  </svg>
);
const QuizIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const VideoOffIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
  </svg>
);
