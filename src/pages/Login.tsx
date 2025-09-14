import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      // ✅ Capture the user returned by the login function
      const loggedInUser = await login(email, password);

      // DEBUG: Log what we got back
      console.log('LOGIN DEBUG - loggedInUser:', loggedInUser);
      console.log('LOGIN DEBUG - user_metadata:', loggedInUser?.user_metadata);
      console.log('LOGIN DEBUG - role:', loggedInUser?.user_metadata?.role);

      // FIXED: Redirect to the correct dashboard routes
      if (loggedInUser?.user_metadata?.role === 'artist') {
        console.log('LOGIN DEBUG - Redirecting to artist-dashboard');
        navigate('/artist-dashboard');
      } else if (loggedInUser?.user_metadata?.role === 'promoter') {
        console.log('LOGIN DEBUG - Redirecting to promoter-dashboard');
        navigate('/promoter-dashboard');
      } else if (loggedInUser?.user_metadata?.role === 'supporter') {
        console.log('LOGIN DEBUG - Redirecting to supporter-dashboard');
        navigate('/supporter-dashboard');
      } else {
        console.log('LOGIN DEBUG - No role found, redirecting to dashboard');
        // If no role found, go to main dashboard (will handle routing)
        navigate('/dashboard');
      }

      setLoading(false);
    } catch (error: any) {
      console.log('LOGIN DEBUG - Login error:', error);
      setErrorMsg(error.message || 'Login failed');
      setLoading(false);
    }
  };

  // Auto-redirect if user is already logged in (only on login page)
  useEffect(() => {
    if (!user) return;

    // Only redirect if we're on the login page
    if (window.location.pathname !== '/login') return;

    const role = user.user_metadata?.role;
    // FIXED: Redirect to correct dashboard routes
    if (role === 'artist') navigate('/artist-dashboard');
    else if (role === 'promoter') navigate('/promoter-dashboard');
    else if (role === 'supporter') navigate('/supporter-dashboard');
    else navigate('/dashboard'); // Fallback
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-border">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-primary-foreground font-bold text-lg">Hyve</span>
          </div>
          <h1 className="text-3xl font-light text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="bg-destructive/20 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary transition-all"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary transition-all"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-medium hover:bg-primary/90 hover:shadow-xl transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              className="text-primary font-medium hover:text-primary/80 hover:underline transition-all"
            >
              Create one
            </Link>
          </p>
        </div>
        <div className="mt-4 text-center">
          <Link
            to="/forgot-password"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-all"
          >
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
}