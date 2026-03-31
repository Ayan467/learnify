import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <div className="font-display text-8xl font-bold gradient-text mb-4">404</div>
        <h1 className="font-display text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn-primary px-6">Go Home</Link>
          <Link to="/courses" className="btn-secondary px-6">Browse Courses</Link>
        </div>
      </div>
    </div>
  );
}
