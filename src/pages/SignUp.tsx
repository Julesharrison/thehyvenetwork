import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    role: 'artist' as 'artist' | 'supporter' | 'promoter',
    username: '',
    stageName: '',
    email: '',
    password: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [stageNameError, setStageNameError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Auto-populate stage name for artists
  useEffect(() => {
    if (formData.role === 'artist' && formData.username && !formData.stageName) {
      setFormData(prev => ({ ...prev, stageName: prev.username }));
    }
  }, [formData.username, formData.role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));
    setGeneralError('');

    // Live username validation
    if (name === 'username') {
      setUsernameError('');
      if (value && !/^[a-zA-Z0-9_]*$/.test(value)) {
        setUsernameError('Username can only contain letters, numbers, and underscores');
      }
    }

    // Live stage name validation
    if (name === 'stageName') {
      setStageNameError('');
      if (value && !/^[a-zA-Z0-9_]*$/.test(value)) {
        setStageNameError('Stage name can only contain letters, numbers, and underscores');
      } else if (value.length > 0 && (value.length < 3 || value.length > 30)) {
        setStageNameError('Stage name must be between 3 and 30 characters');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setStageNameError('');
    setConfirmPasswordError('');
    setGeneralError('');

    let hasErrors = false;

    // Username validation
    if (formData.username.length < 3 || formData.username.length > 20) {
      setUsernameError('Username must be between 3 and 20 characters');
      hasErrors = true;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      hasErrors = true;
    }

    // Stage name validation (for artists)
    if (formData.role === 'artist' && formData.stageName) {
      if (formData.stageName.length < 3 || formData.stageName.length > 30) {
        setStageNameError('Stage name must be between 3 and 30 characters');
        hasErrors = true;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(formData.stageName)) {
        setStageNameError('Stage name can only contain letters, numbers, and underscores');
        hasErrors = true;
      }
    }

    // Password validation
    if (formData.password.length < 6) {
      setConfirmPasswordError('Password must be at least 6 characters');
      hasErrors = true;
    }

    if (formData.password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasErrors = true;
    }

    if (hasErrors) return;

    setLoading(true);

    if (!signup) {
      setGeneralError('Authentication service not available');
      setLoading(false);
      return;
    }

    const result = await signup(formData.email, formData.password, {
      username: formData.username,
      role: formData.role,
      stageName: formData.role === 'artist' ? formData.stageName : undefined
    });

    setLoading(false);

    if (!result.success) {
      setGeneralError(result.error || 'Signup failed');
      return;
    }

    // Redirect based on the selected role
    switch (formData.role) {
      case 'artist':
        navigate('/artist');
        break;
      case 'promoter':
        navigate('/promoter');
        break;
      case 'supporter':
      default:
        navigate('/supporter');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-border">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-primary-foreground font-bold text-lg">Hyve</span>
          </div>
          <h1 className="text-3xl font-light text-foreground mb-2">Join Hyve</h1>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {generalError && (
            <div className="bg-destructive/20 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm">
              {generalError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-4 bg-input border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary transition-all"
            >
              <option value="artist">Artist</option>
              <option value="supporter">Supporter</option>
              <option value="promoter">Promoter</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-4 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary transition-all"
              placeholder="Choose a username"
              required
            />
            {usernameError && <p className="text-destructive text-sm mt-2">{usernameError}</p>}
          </div>

          {formData.role === 'artist' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Stage Name (Optional)</label>
              <input
                type="text"
                name="stageName"
                value={formData.stageName}
                onChange={handleChange}
                className="w-full px-4 py-4 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary transition-all"
                placeholder="Your stage name"
              />
              {stageNameError && <p className="text-destructive text-sm mt-2">{stageNameError}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-4 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary transition-all"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-4 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary transition-all pr-12"
                placeholder="Create a password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md p-1 transition-all"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setConfirmPasswordError('');
              }}
              className="w-full px-4 py-4 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary transition-all"
              placeholder="Confirm your password"
              required
            />
            {confirmPasswordError && <p className="text-destructive text-sm mt-2">{confirmPasswordError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-medium hover:bg-primary/90 hover:shadow-xl transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/"
              className="text-primary font-medium hover:text-primary/80 hover:underline transition-all"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
