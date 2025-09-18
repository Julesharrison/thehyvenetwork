import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Music4, HandHeart, Megaphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import ParentContainer from '../components/ParentContainer';
import ContentWrapper from '../components/ContentWrapper';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Link } from '../components/ui/link';

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    role: 'artist' as 'artist' | 'supporter' | 'promoter',
    profileHandle: '',
    stageName: '',
    email: '',
    password: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [stageNameError, setStageNameError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const { showHeader, hideHeader } = useHeader();

  // Role options for SegmentedControl
  const roleOptions = [
    { value: 'artist', label: 'Artist', icon: <Music4 className="w-4 h-4" /> },
    { value: 'supporter', label: 'Supporter', icon: <HandHeart className="w-4 h-4" />  },
    { value: 'promoter', label: 'Promoter', icon: <Megaphone className="w-4 h-4" />  }
  ];

  // Auto-populate stage name for artists
  useEffect(() => {
    if (formData.role === 'artist' && formData.profileHandle && !formData.stageName) {
      setFormData(prev => ({ ...prev, stageName: prev.profileHandle }));
    }
  }, [formData.profileHandle, formData.role]);

    useEffect(() => {
    // Show header when component mounts
    showHeader();

    // Hide header when component unmounts
    return () => {
      hideHeader();
    };
  }, [showHeader, hideHeader]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));
    setGeneralError('');

    // Live profileHandle validation
    if (name === 'profileHandle') {
      setUsernameError('');
      if (value && !/^[a-zA-Z0-9_]*$/.test(value)) {
        setUsernameError('profileHandle can only contain letters, numbers, and underscores');
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

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({ ...prev, role: role as 'artist' | 'supporter' | 'promoter' }));
    setGeneralError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setStageNameError('');
    setConfirmPasswordError('');
    setGeneralError('');

    let hasErrors = false;

    // profileHandle validation
    if (formData.profileHandle.length < 3 || formData.profileHandle.length > 20) {
      setUsernameError('profileHandle must be between 3 and 20 characters');
      hasErrors = true;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.profileHandle)) {
      setUsernameError('profileHandle can only contain letters, numbers, and underscores');
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
      profileHandle: formData.profileHandle,
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
    <ParentContainer>
      <ContentWrapper>
        <div className="text-center mb-8">
          <h1 className="text-headline-lg text-foreground">Create an account</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {generalError && (
            <div className="bg-destructive/20 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm">
              {generalError}
            </div>
          )}
          <div>
            <SegmentedControl
              options={roleOptions}
              value={formData.role}
              onValueChange={handleRoleChange}
            />
          </div>

          <div>
            <Input
              type="text"
              name="profileHandle"
              label="profileHandle"
              value={formData.profileHandle}
              onChange={handleChange}
              placeholder="Choose a profileHandle"
              required
            />
            {usernameError && <p className="text-destructive text-sm mt-2">{usernameError}</p>}
          </div>

          {formData.role === 'artist' && (
            <div>
              <Input
                type="text"
                name="stageName"
                label="Stage Name (Optional)"
                value={formData.stageName}
                onChange={handleChange}
                placeholder="Your stage name"
              />
              {stageNameError && <p className="text-destructive text-sm mt-2">{stageNameError}</p>}
            </div>
          )}

          <div>
            <Input
              type="email"
              name="email"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="Create a password"
                className="pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-6 bottom-3 rounded-md transition-all flex items-center justify-center ${
                  passwordFocused ? 'text-primary' : 'text-light-grey'
                }`}
              >
                {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </button>
            </div>
          </div>

          <div>
            <Input
              type="password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setConfirmPasswordError('');
              }}
              placeholder="Confirm your password"
              required
            />
            {confirmPasswordError && <p className="text-destructive text-sm mt-2">{confirmPasswordError}</p>}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-light-grey">
            Already have an account?{' '}
            <Link
              to="/login"
              variant="primary"
              underline
            >
              Sign in
            </Link>
          </p>
        </div>
      </ContentWrapper>
    </ParentContainer>
  );
}
