import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';

const STATS = [
  { label: 'Courses', value: '10+' },
  { label: 'Students', value: '500+' },
  { label: 'Free Courses', value: '2' },
  { label: 'Certificates', value: '100+' },
];

const FEATURES = [
  { icon: '🎬', title: 'Video Lectures', desc: 'Watch HD lectures inside the platform or directly on YouTube.' },
  { icon: '🧠', title: 'Quizzes After Each Lecture', desc: 'Test your understanding with MCQs and track your scores.' },
  { icon: '📊', title: 'Progress Tracking', desc: 'Visual progress bars keep you on track toward completion.' },
  { icon: '🏆', title: 'Course Certificates', desc: 'Download a beautiful PDF certificate after completing any course.' },
  { icon: '💬', title: 'Live Chat Support', desc: 'Message the admin directly in real-time via our built-in chat.' },
  { icon: '🤖', title: 'Alexa AI Assistant', desc: 'Ask our AI chatbot anything — courses, tips, or just say hello.' },
];

export default function Landing() {
  const { user } = useAuth();
  const heroRef = useRef(null);

  // Parallax-lite effect
  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current) {
        heroRef.current.style.transform = `translateY(${window.scrollY * 0.2}px)`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div ref={heroRef} className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary-600/10 blur-[120px]" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-violet-600/8 blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-[500px] h-[300px] rounded-full bg-cyan-600/6 blur-[100px]" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 text-center animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
            Advanced · Full-Stack Learning Platform
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            Learn. Build.{' '}
            <span className="gradient-text">Grow.</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Master modern web development with hands-on courses, real-time support, and AI-powered learning assistance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? (
              <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="btn-primary text-base px-8 py-3.5">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-base px-8 py-3.5">
                  Start Learning Free →
                </Link>
                <Link to="/courses" className="btn-secondary text-base px-8 py-3.5">
                  Browse Courses
                </Link>
              </>
            )}
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 mt-16">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-bold text-white">{s.value}</p>
                <p className="text-slate-500 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="section-title">Everything you need to succeed</h2>
            <p className="text-slate-500 max-w-xl mx-auto">From your first line of code to a job-ready portfolio.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="glass-card p-6 hover:border-primary-500/20 transition-all duration-300 group"
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">{f.icon}</div>
                <h3 className="font-display font-semibold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 to-violet-600/5" />
            <div className="relative">
              <h2 className="section-title mb-4">Ready to start your journey?</h2>
              <p className="text-slate-400 mb-8">Join hundreds of learners already building skills on Learnify.</p>
              <Link to="/register" className="btn-primary text-base px-10 py-3.5 inline-block">
                Create Free Account →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">L</span>
            </div>
            <span className="font-display font-semibold text-white">Learnify</span>
          </div>
          <p className="text-slate-600 text-sm">© 2024 Learnify. Built with ❤️ using MERN Stack.</p>
        </div>
      </footer>
    </div>
  );
}
