import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { myEnrollments, fetchMyEnrollments, downloadCertificate } = useCourse();

  useEffect(() => { fetchMyEnrollments(); }, []);

  const completed = myEnrollments.filter(e => e.isCompleted);
  const inProgress = myEnrollments.filter(e => !e.isCompleted);
  const avgProgress = myEnrollments.length
    ? Math.round(myEnrollments.reduce((a, e) => a + (e.progressPercent || 0), 0) / myEnrollments.length)
    : 0;

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 animate-fade-in">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">
              Welcome back, <span className="gradient-text">{user?.name.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-slate-500 mt-1">Track your learning progress and continue where you left off.</p>
          </div>
          <Link to="/courses" className="btn-primary whitespace-nowrap">Browse Courses</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Enrolled', value: myEnrollments.length, icon: '📚', color: 'text-primary-400' },
            { label: 'Completed', value: completed.length, icon: '🏆', color: 'text-emerald-400' },
            { label: 'In Progress', value: inProgress.length, icon: '⚡', color: 'text-amber-400' },
            { label: 'Avg Progress', value: `${avgProgress}%`, icon: '📊', color: 'text-violet-400' },
          ].map(s => (
            <div key={s.label} className="glass-card p-5 text-center">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-slate-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Enrolled courses */}
        {myEnrollments.length === 0 ? (
          <div className="glass-card p-16 text-center animate-fade-in">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="font-display font-semibold text-white text-xl mb-2">Start your learning journey</h3>
            <p className="text-slate-500 mb-6">You haven't enrolled in any courses yet. Browse our catalog to get started!</p>
            <Link to="/courses" className="btn-primary inline-block px-8">Browse Courses</Link>
          </div>
        ) : (
          <>
            {/* In Progress */}
            {inProgress.length > 0 && (
              <section className="mb-10 animate-slide-up">
                <h2 className="font-display font-bold text-xl text-white mb-5">Continue Learning</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {inProgress.map(enrollment => (
                    <EnrollmentCard key={enrollment._id} enrollment={enrollment} />
                  ))}
                </div>
              </section>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <section className="animate-slide-up">
                <h2 className="font-display font-bold text-xl text-white mb-5">Completed Courses 🏆</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {completed.map(enrollment => (
                    <EnrollmentCard key={enrollment._id} enrollment={enrollment}
                      onDownloadCert={() => downloadCertificate(enrollment.course._id, enrollment.course.title)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EnrollmentCard({ enrollment, onDownloadCert }) {
  const course = enrollment.course;
  if (!course) return null;

  return (
    <div className="glass-card overflow-hidden flex flex-col card-hover">
      {/* Thumbnail strip */}
      <div className="h-2 bg-gradient-to-r from-primary-600 to-violet-600" style={{ width: `${enrollment.progressPercent}%` }} />

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-white text-sm leading-snug flex-1 line-clamp-2">
            {course.title}
          </h3>
          {enrollment.isCompleted && <span className="text-emerald-400 text-lg flex-shrink-0">✓</span>}
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>{enrollment.completedLectures?.length || 0} lectures done</span>
            <span className="text-primary-400 font-medium">{enrollment.progressPercent || 0}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${enrollment.progressPercent || 0}%` }} />
          </div>
        </div>

        {/* Quiz scores */}
        {enrollment.quizScores?.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>🧠</span>
            <span>Avg quiz: {Math.round(enrollment.quizScores.reduce((a, q) => a + q.score, 0) / enrollment.quizScores.length)}%</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2">
          <Link to={`/learn/${course._id}`} className="btn-primary text-sm py-2 flex-1 text-center">
            {enrollment.isCompleted ? 'Review' : 'Continue'}
          </Link>
          {enrollment.isCompleted && (
            <button onClick={onDownloadCert}
              className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5">
              <span>📜</span>
              <span>Cert</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
