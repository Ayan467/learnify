import { Link } from 'react-router-dom';

const CATEGORY_COLORS = {
  'Web Development': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Data Science': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Mobile Dev': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'UI/UX': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'DevOps': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Other': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const LEVEL_COLORS = {
  Beginner: 'text-emerald-400',
  Intermediate: 'text-amber-400',
  Advanced: 'text-red-400',
};

export default function CourseCard({ course, enrolled = false, progress = 0 }) {
  const categoryColor = CATEGORY_COLORS[course.category] || CATEGORY_COLORS['Other'];
  const levelColor = LEVEL_COLORS[course.level] || 'text-slate-400';

  return (
    <Link to={`/courses/${course._id}`} className="block group">
      <div className="glass-card overflow-hidden card-hover h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-dark-600 to-dark-700">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-600/20 border border-primary-500/20 flex items-center justify-center">
                <BookIcon />
              </div>
            </div>
          )}

          {/* Free badge */}
          {course.isFree && (
            <span className="absolute top-3 left-3 badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              FREE
            </span>
          )}

          {/* Enrolled badge */}
          {enrolled && (
            <span className="absolute top-3 right-3 badge bg-primary-500/20 text-primary-400 border border-primary-500/30 text-xs">
              Enrolled
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-3 flex-1">
          {/* Category + Level */}
          <div className="flex items-center justify-between">
            <span className={`badge border text-xs ${categoryColor}`}>{course.category}</span>
            <span className={`text-xs font-medium ${levelColor}`}>{course.level}</span>
          </div>

          {/* Title */}
          <h3 className="font-display font-semibold text-white text-base leading-snug group-hover:text-primary-400 transition-colors line-clamp-2">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 flex-1">
            {course.description}
          </p>

          {/* Progress bar (if enrolled) */}
          {enrolled && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Progress</span>
                <span className="text-primary-400 font-medium">{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <UsersIcon />
              <span>{course.totalStudents || 0} students</span>
            </div>
            <div className="text-right">
              {course.isFree ? (
                <span className="text-emerald-400 font-bold text-sm">Free</span>
              ) : (
                <span className="text-white font-bold text-sm">₹{course.price?.toLocaleString('en-IN')}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

const BookIcon = () => (
  <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);
const UsersIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
