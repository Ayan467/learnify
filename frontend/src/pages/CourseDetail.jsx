import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseAPI, paymentAPI } from '../utils/api';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';
import toast from 'react-hot-toast';

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { enrollFree, isEnrolled, getEnrollment, fetchMyEnrollments } = useCourse();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: res } = await courseAPI.getOne(id);
        setData(res.data);
      } catch {
        toast.error('Course not found.');
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };
    load();
    if (user) fetchMyEnrollments();
  }, [id, user]);

  const enrolled = user && data?.course && isEnrolled(data.course._id);
  const enrollment = enrolled ? getEnrollment(data?.course._id) : null;

  const handleEnroll = async () => {
    if (!user) { navigate('/login'); return; }
    setEnrolling(true);
    try {
      if (data.course.isFree || data.course.price === 0) {
        await enrollFree(data.course._id);
        navigate(`/learn/${data.course._id}`);
      } else {
        // Razorpay flow
        const { data: orderData } = await paymentAPI.createOrder(data.course._id);
        const options = {
          key: orderData.data.keyId,
          amount: orderData.data.amount,
          currency: orderData.data.currency,
          name: 'Learnify',
          description: orderData.data.courseTitle,
          order_id: orderData.data.orderId,
          handler: async (response) => {
            try {
              await paymentAPI.verify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                courseId: data.course._id,
              });
              await fetchMyEnrollments();
              toast.success('Payment successful! 🎉 You are now enrolled.');
              navigate(`/learn/${data.course._id}`);
            } catch {
              toast.error('Payment verification failed. Contact support.');
            }
          },
          prefill: { name: user.name, email: user.email },
          theme: { color: '#6366f1' },
        };
        if (!window.Razorpay) {
          // Load Razorpay script dynamically
          await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://checkout.razorpay.com/v1/checkout.js';
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
          });
        }
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', () => toast.error('Payment failed. Please try again.'));
        rzp.open();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;
  const { course, lectures } = data;

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        <div className="grid lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="badge bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs">{course.category}</span>
                <span className="text-slate-600 text-xs">{course.level}</span>
              </div>
              <h1 className="font-display text-3xl font-bold text-white leading-tight mb-3">{course.title}</h1>
              <p className="text-slate-400 leading-relaxed">{course.description}</p>
            </div>

            {/* Tags */}
            {course.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {course.tags.map(tag => (
                  <span key={tag} className="badge bg-white/5 border border-white/10 text-slate-400 text-xs">{tag}</span>
                ))}
              </div>
            )}

            {/* Progress if enrolled */}
            {enrolled && (
              <div className="glass-card p-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-white">Your progress</span>
                  <span className="text-primary-400 font-bold">{enrollment.progressPercent || 0}%</span>
                </div>
                <div className="progress-bar mb-4">
                  <div className="progress-fill" style={{ width: `${enrollment.progressPercent || 0}%` }} />
                </div>
                <Link to={`/learn/${course._id}`} className="btn-primary w-full text-center block">
                  {enrollment.progressPercent === 100 ? '🏆 Review Course' : '▶ Continue Learning'}
                </Link>
              </div>
            )}

            {/* Lectures list */}
            <div>
              <h2 className="font-display font-bold text-xl text-white mb-4">
                Course Content <span className="text-slate-500 font-normal text-base">({lectures.length} lectures)</span>
              </h2>
              <div className="space-y-2">
                {lectures.map((lec, i) => (
                  <div key={lec._id} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                    enrolled ? 'border-white/5 bg-white/2 hover:border-white/10' : 'border-white/5 bg-white/2'
                  }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                      enrollment?.completedLectures?.includes(lec._id)
                        ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-500'
                    }`}>
                      {enrollment?.completedLectures?.includes(lec._id) ? '✓' : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{lec.title}</p>
                      {lec.description && <p className="text-xs text-slate-500 truncate mt-0.5">{lec.description}</p>}
                    </div>
                    {lec.isFreePreview && (
                      <span className="badge bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex-shrink-0">Preview</span>
                    )}
                    <VideoIcon />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24 space-y-5">
              {/* Thumbnail */}
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="w-full h-40 object-cover rounded-xl" />
              ) : (
                <div className="w-full h-40 rounded-xl bg-gradient-to-br from-primary-600/20 to-violet-600/20 flex items-center justify-center">
                  <BookIcon />
                </div>
              )}

              {/* Price */}
              <div className="text-center">
                {course.isFree ? (
                  <span className="text-3xl font-display font-bold text-emerald-400">Free</span>
                ) : (
                  <span className="text-3xl font-display font-bold text-white">₹{course.price?.toLocaleString('en-IN')}</span>
                )}
              </div>

              {/* CTA */}
              {enrolled ? (
                <Link to={`/learn/${course._id}`} className="btn-primary w-full text-center block py-3">
                  Continue Learning →
                </Link>
              ) : (
                <button onClick={handleEnroll} disabled={enrolling} className="btn-primary w-full py-3">
                  {enrolling ? 'Processing...' : course.isFree ? 'Enroll for Free' : `Pay ₹${course.price?.toLocaleString('en-IN')}`}
                </button>
              )}
              {!user && (
                <p className="text-center text-xs text-slate-500">
                  <Link to="/login" className="text-primary-400 hover:underline">Sign in</Link> to enroll
                </p>
              )}

              {/* Course meta */}
              <div className="space-y-2.5 pt-2 border-t border-white/5 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Lectures</span><span className="text-white">{lectures.length}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Level</span><span className="text-white">{course.level}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Students</span><span className="text-white">{course.totalStudents}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Certificate</span><span className="text-emerald-400">✓ Yes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const VideoIcon = () => (
  <svg className="w-4 h-4 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const BookIcon = () => (
  <svg className="w-12 h-12 text-primary-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);
