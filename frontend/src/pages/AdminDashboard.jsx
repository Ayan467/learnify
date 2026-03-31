import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import { adminAPI, courseAPI, quizAPI } from '../utils/api';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Courses', 'Students', 'Enrollments'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Course form state
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', price: '', isFree: false, category: 'Web Development', level: 'Beginner', tags: '' });
  const [thumbnail, setThumbnail] = useState(null);

  // Lecture form
  const [showLectureForm, setShowLectureForm] = useState(null); // courseId
  const [lectureForm, setLectureForm] = useState({ title: '', description: '', youtubeUrl: '', isFreePreview: false });
  const [lectureVideo, setLectureVideo] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sRes, cRes, stRes, eRes] = await Promise.all([
        adminAPI.getStats(), courseAPI.getAll({ limit: 50 }),
        adminAPI.getStudents(), adminAPI.getStats(),
      ]);
      setStats(sRes.data.data);
      setCourses(cRes.data.data.courses);
      setStudents(stRes.data.data.students);
      setEnrollments(sRes.data.data.recentEnrollments);
    } catch { toast.error('Failed to load dashboard data.'); }
    finally { setLoading(false); }
  };

  const handleSaveCourse = async () => {
    if (!courseForm.title || !courseForm.description || !courseForm.category) {
      toast.error('Title, description, and category are required.'); return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(courseForm).forEach(([k, v]) => fd.append(k, v));
      if (thumbnail) fd.append('thumbnail', thumbnail);

      if (editingCourse) {
        await courseAPI.update(editingCourse._id, fd);
        toast.success('Course updated!');
      } else {
        await courseAPI.create(fd);
        toast.success('Course created!');
      }
      setShowCourseForm(false);
      setEditingCourse(null);
      setCourseForm({ title: '', description: '', price: '', isFree: false, category: 'Web Development', level: 'Beginner', tags: '' });
      setThumbnail(null);
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save course.');
    } finally { setSaving(false); }
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm('Delete this course and all its lectures?')) return;
    try {
      await courseAPI.delete(id);
      toast.success('Course deleted.');
      await loadAll();
    } catch { toast.error('Failed to delete course.'); }
  };

  const handleAddLecture = async (courseId) => {
    if (!lectureForm.title) { toast.error('Lecture title is required.'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(lectureForm).forEach(([k, v]) => fd.append(k, v));
      if (lectureVideo) fd.append('video', lectureVideo);
      await courseAPI.addLecture(courseId, fd);
      toast.success('Lecture added!');
      setShowLectureForm(null);
      setLectureForm({ title: '', description: '', youtubeUrl: '', isFreePreview: false });
      setLectureVideo(null);
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add lecture.');
    } finally { setSaving(false); }
  };

  const handleToggleStudent = async (id) => {
    try {
      const { data } = await adminAPI.toggleStudent(id);
      toast.success(data.message);
      setStudents(prev => prev.map(s => s._id === id ? { ...s, isActive: data.data.user.isActive } : s));
    } catch { toast.error('Failed to toggle student.'); }
  };

  const openEdit = (course) => {
    setEditingCourse(course);
    setCourseForm({ title: course.title, description: course.description, price: course.price, isFree: course.isFree, category: course.category, level: course.level, tags: course.tags?.join(', ') || '' });
    setShowCourseForm(true);
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your platform</p>
          </div>
          <Link to="/admin/chat" className="btn-secondary text-sm flex items-center gap-2">
            💬 Student Chat
          </Link>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Students', value: stats.stats.totalStudents, icon: '👥', color: 'text-primary-400' },
              { label: 'Total Courses', value: stats.stats.totalCourses, icon: '📚', color: 'text-violet-400' },
              { label: 'Enrollments', value: stats.stats.totalEnrollments, icon: '🎯', color: 'text-amber-400' },
              { label: 'Revenue', value: `₹${stats.stats.totalRevenue?.toLocaleString('en-IN') || 0}`, icon: '💰', color: 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="glass-card p-5 text-center">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-slate-500 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/3 p-1 rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── Overview ─────────────────────── */}
        {tab === 'Overview' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="font-display font-semibold text-white text-lg mb-4">Recent Enrollments</h2>
              <div className="glass-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-4 py-3 text-slate-500 font-medium">Student</th>
                      <th className="text-left px-4 py-3 text-slate-500 font-medium">Course</th>
                      <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-slate-500 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments?.map(e => (
                      <tr key={e._id} className="border-b border-white/3 hover:bg-white/2">
                        <td className="px-4 py-3 text-white">{e.student?.name || '—'}</td>
                        <td className="px-4 py-3 text-slate-400 truncate max-w-[200px]">{e.course?.title || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`badge text-xs ${e.paymentStatus === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : e.paymentStatus === 'free' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'} border`}>
                            {e.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{e.paymentStatus === 'free' ? 'Free' : `₹${e.amountPaid}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Courses ─────────────────────── */}
        {tab === 'Courses' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-display font-semibold text-white text-lg">All Courses ({courses.length})</h2>
              <button onClick={() => { setEditingCourse(null); setShowCourseForm(true); }} className="btn-primary text-sm">+ Add Course</button>
            </div>

            <div className="space-y-3">
              {courses.map(course => (
                <div key={course._id} className="glass-card p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                    {course.thumbnail ? <img src={course.thumbnail} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-primary-600/20" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{course.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">{course.category}</span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className={`text-xs font-medium ${course.isFree ? 'text-emerald-400' : 'text-white'}`}>
                        {course.isFree ? 'Free' : `₹${course.price}`}
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-slate-500">{course.totalStudents} students</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setShowLectureForm(course._id)} className="btn-secondary text-xs py-1.5 px-3">+ Lecture</button>
                    <button onClick={() => openEdit(course)} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                    <button onClick={() => handleDeleteCourse(course._id)} className="btn-danger text-xs py-1.5 px-3">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Students ─────────────────────── */}
        {tab === 'Students' && (
          <div className="animate-fade-in">
            <h2 className="font-display font-semibold text-white text-lg mb-5">All Students ({students.length})</h2>
            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Name</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Email</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Joined</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s._id} className="border-b border-white/3 hover:bg-white/2">
                      <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                      <td className="px-4 py-3 text-slate-400">{s.email}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className={`badge border text-xs ${s.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleToggleStudent(s._id)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${s.isActive ? 'border-red-500/20 text-red-400 hover:bg-red-500/10' : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'}`}>
                          {s.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Enrollments ─────────────────────── */}
        {tab === 'Enrollments' && (
          <div className="animate-fade-in">
            <h2 className="font-display font-semibold text-white text-lg mb-5">All Enrollments</h2>
            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Student</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Course</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Progress</th>
                    <th className="text-left px-4 py-3 text-slate-500 font-medium">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments?.map(e => (
                    <tr key={e._id} className="border-b border-white/3 hover:bg-white/2">
                      <td className="px-4 py-3 text-white">{e.student?.name || '—'}</td>
                      <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{e.course?.title || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${e.progressPercent || 0}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{e.progressPercent || 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge border text-xs ${e.paymentStatus === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                          {e.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Course Form Modal ──────────────── */}
      {showCourseForm && (
        <div className="modal-overlay">
          <div className="glass-card w-full max-w-lg mx-4 p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-display font-bold text-white text-lg">{editingCourse ? 'Edit Course' : 'Add New Course'}</h2>
              <button onClick={() => setShowCourseForm(false)} className="text-slate-500 hover:text-white p-1">✕</button>
            </div>
            <div className="space-y-4">
              <input placeholder="Course title *" value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} className="input-field" />
              <textarea placeholder="Description *" value={courseForm.description} onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} className="input-field min-h-[100px] resize-y" />
              <div className="grid grid-cols-2 gap-4">
                <select value={courseForm.category} onChange={e => setCourseForm(p => ({ ...p, category: e.target.value }))} className="input-field">
                  {['Web Development','Data Science','Mobile Dev','UI/UX','DevOps','Other'].map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={courseForm.level} onChange={e => setCourseForm(p => ({ ...p, level: e.target.value }))} className="input-field">
                  {['Beginner','Intermediate','Advanced'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={courseForm.isFree} onChange={e => setCourseForm(p => ({ ...p, isFree: e.target.checked, price: e.target.checked ? '0' : p.price }))} className="w-4 h-4 accent-primary-500" />
                  <span className="text-sm text-slate-300">Free course</span>
                </label>
                {!courseForm.isFree && (
                  <input type="number" placeholder="Price (₹)" value={courseForm.price} onChange={e => setCourseForm(p => ({ ...p, price: e.target.value }))} className="input-field flex-1 py-2" />
                )}
              </div>
              <input placeholder="Tags (comma separated)" value={courseForm.tags} onChange={e => setCourseForm(p => ({ ...p, tags: e.target.value }))} className="input-field" />
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Thumbnail image</label>
                <input type="file" accept="image/*" onChange={e => setThumbnail(e.target.files[0])} className="input-field text-sm file:mr-3 file:text-primary-400 file:bg-transparent file:border-0 file:cursor-pointer" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCourseForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSaveCourse} disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Lecture Form Modal ──────────────── */}
      {showLectureForm && (
        <div className="modal-overlay">
          <div className="glass-card w-full max-w-lg mx-4 p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-display font-bold text-white text-lg">Add Lecture</h2>
              <button onClick={() => setShowLectureForm(null)} className="text-slate-500 hover:text-white p-1">✕</button>
            </div>
            <div className="space-y-4">
              <input placeholder="Lecture title *" value={lectureForm.title} onChange={e => setLectureForm(p => ({ ...p, title: e.target.value }))} className="input-field" />
              <textarea placeholder="Description (optional)" value={lectureForm.description} onChange={e => setLectureForm(p => ({ ...p, description: e.target.value }))} className="input-field min-h-[80px] resize-y" />
              <input placeholder="YouTube embed URL (e.g. https://www.youtube.com/embed/...)" value={lectureForm.youtubeUrl} onChange={e => setLectureForm(p => ({ ...p, youtubeUrl: e.target.value }))} className="input-field" />
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Or upload video file (mp4, webm)</label>
                <input type="file" accept="video/*" onChange={e => setLectureVideo(e.target.files[0])} className="input-field text-sm file:mr-3 file:text-primary-400 file:bg-transparent file:border-0 file:cursor-pointer" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={lectureForm.isFreePreview} onChange={e => setLectureForm(p => ({ ...p, isFreePreview: e.target.checked }))} className="w-4 h-4 accent-primary-500" />
                <span className="text-sm text-slate-300">Free preview lecture</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowLectureForm(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => handleAddLecture(showLectureForm)} disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Adding...' : 'Add Lecture'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
