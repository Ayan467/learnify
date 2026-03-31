import { useEffect, useState } from 'react';
import Navbar from '../components/common/Navbar';
import CourseCard from '../components/common/CourseCard';
import { useCourse } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Web Development', 'Data Science', 'Mobile Dev', 'UI/UX', 'DevOps', 'Other'];
const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function Courses() {
  const { courses, loading, fetchCourses, isEnrolled, getEnrollment } = useCourse();
  const { user } = useAuth();
  const [filters, setFilters] = useState({ category: 'All', level: 'All', isFree: false, search: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 350);
    return () => clearTimeout(t);
  }, [filters.search]);

  useEffect(() => {
    const params = {};
    if (filters.category !== 'All') params.category = filters.category;
    if (filters.level !== 'All') params.level = filters.level;
    if (filters.isFree) params.isFree = true;
    if (debouncedSearch) params.search = debouncedSearch;
    fetchCourses(params);
  }, [filters.category, filters.level, filters.isFree, debouncedSearch]);

  const set = (k) => (v) => setFilters(p => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <h1 className="section-title">Explore Courses</h1>
          <p className="text-slate-500">Learn from industry-standard video lectures with quizzes and certificates.</p>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center animate-slide-up">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <SearchIcon />
            <input value={filters.search} onChange={e => set('search')(e.target.value)}
              placeholder="Search courses..."
              className="input-field pl-10 py-2.5 text-sm" />
          </div>

          {/* Category */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => set('category')(c)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filters.category === c
                    ? 'bg-primary-600/20 border-primary-500/40 text-primary-400'
                    : 'border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
                }`}>
                {c}
              </button>
            ))}
          </div>

          {/* Level */}
          <select value={filters.level} onChange={e => set('level')(e.target.value)}
            className="input-field py-2 text-sm w-auto min-w-[130px]">
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          {/* Free toggle */}
          <button onClick={() => set('isFree')(!filters.isFree)}
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-colors whitespace-nowrap ${
              filters.isFree ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'border-white/10 text-slate-500 hover:text-white'
            }`}>
            <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${filters.isFree ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'}`}>
              {filters.isFree && <span className="text-white text-[10px] leading-none">✓</span>}
            </span>
            Free only
          </button>
        </div>

        {/* Results count */}
        <p className="text-slate-500 text-sm mb-5">
          {loading ? 'Loading...' : `${courses.length} course${courses.length !== 1 ? 's' : ''} found`}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card h-72 shimmer" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-display font-semibold text-white text-xl mb-2">No courses found</h3>
            <p className="text-slate-500 mb-6">Try adjusting your filters or search terms.</p>
            <button onClick={() => setFilters({ category: 'All', level: 'All', isFree: false, search: '' })}
              className="btn-secondary text-sm">Clear filters</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {courses.map(course => {
              const enrolled = user && isEnrolled(course._id);
              const enrollment = enrolled ? getEnrollment(course._id) : null;
              return (
                <CourseCard key={course._id} course={course}
                  enrolled={enrolled}
                  progress={enrollment?.progressPercent || 0} />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const SearchIcon = () => (
  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
