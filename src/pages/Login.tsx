import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useHeader } from '../contexts/HeaderContext';
import ParentContainer from '../components/ParentContainer';
import ContentWrapper from '../components/ContentWrapper';
import { Link } from '../components/ui/link';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { showHeader, hideHeader } = useHeader();

  useEffect(() => {
    // Show header when component mounts
    showHeader();

    // Hide header when component unmounts
    return () => {
      hideHeader();
    };
  }, [showHeader, hideHeader]);

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
    <ParentContainer>
      <ContentWrapper>
        <div className="text-center mb-8 border">
          <h1 className="text-headline-lg text-foreground">Welcome Back</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="bg-destructive/20 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-body-md">
              {errorMsg}
            </div>
          )}
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full font-medium"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <div className="mt-8 text-center">
          <p className="text-light-grey">
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              variant="primary"
              underline
            >
              Create one
            </Link>
          </p>
        </div>
        <div className="mt-4 text-center">
          <Link
            to="/forgot-password"
            variant="primary"
            underline
          >
            Forgot your password?
          </Link>
        </div>
      </ContentWrapper>
    </ParentContainer>
  );
}