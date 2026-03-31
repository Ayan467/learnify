import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AuthLayout = ({ children, title, subtitle }) => (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 relative overflow-hidden">
    {/* Background */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary-600/8 blur-[120px] pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full bg-violet-600/6 blur-[100px] pointer-events-none" />

    <div className="w-full max-w-md animate-slide-up relative">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
            <span className="text-white font-display font-bold text-xl">L</span>
          </div>
          <span className="font-display font-bold text-2xl text-white">Learnify</span>
        </Link>
        <h1 className="text-2xl font-display font-bold text-white mt-6 mb-1">{title}</h1>
        <p className="text-slate-500 text-sm">{subtitle}</p>
      </div>

      <div className="glass-card p-8">{children}</div>
    </div>
  </div>
);

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Learnify account">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Email address</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com"
            className="input-field" autoComplete="email" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')}
              placeholder="Enter your password" className="input-field pr-10" autoComplete="current-password" />
            <button type="button" onClick={() => setShowPwd(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showPwd ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? <Spinner /> : 'Sign in'}
        </button>

        {/* Demo credentials */}
        <div className="rounded-xl bg-white/3 border border-white/5 p-4 space-y-1.5">
          <p className="text-xs text-slate-500 font-medium mb-2">Demo accounts:</p>
          <DemoBtn label="Admin" email="admin@learnify.com" pwd="Admin@123" setForm={setForm} />
          <DemoBtn label="Student" email="student@learnify.com" pwd="Student@123" setForm={setForm} />
        </div>

        <p className="text-center text-slate-500 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">Create one</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

const DemoBtn = ({ label, email, pwd, setForm }) => (
  <button type="button" onClick={() => setForm({ email, password: pwd })}
    className="w-full text-left text-xs px-3 py-2 rounded-lg bg-white/3 hover:bg-white/6 text-slate-400 hover:text-slate-200 transition-colors flex justify-between">
    <span className="font-medium">{label}</span>
    <span className="text-slate-600">{email}</span>
  </button>
);

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Please fill all fields.'); return; }
    if (form.name.length < 2) { toast.error('Name must be at least 2 characters.'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Join thousands of learners on Learnify">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Full name</label>
          <input type="text" value={form.name} onChange={set('name')} placeholder="John Doe"
            className="input-field" autoComplete="name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Email address</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com"
            className="input-field" autoComplete="email" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')}
              placeholder="Min 6 characters" className="input-field pr-10" autoComplete="new-password" />
            <button type="button" onClick={() => setShowPwd(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showPwd ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {form.password && (
            <PasswordStrength password={form.password} />
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? <Spinner /> : 'Create account'}
        </button>

        <p className="text-center text-slate-500 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

const PasswordStrength = ({ password }) => {
  const strength = password.length < 6 ? 1 : password.length < 8 ? 2 : /[A-Z]/.test(password) && /\d/.test(password) ? 4 : 3;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];
  return (
    <div className="mt-2 flex gap-1 items-center">
      {[1,2,3,4].map(i => (
        <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? colors[strength] : 'bg-white/10'} transition-all`} />
      ))}
      <span className="text-xs text-slate-500 ml-1">{labels[strength]}</span>
    </div>
  );
};

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);
const Spinner = () => (
  <span className="flex items-center justify-center gap-2">
    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    Please wait...
  </span>
);

export default Login;
