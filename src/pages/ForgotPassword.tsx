import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import ParentContainer from '../components/ParentContainer';
import ContentWrapper from '../components/ContentWrapper';
import { useHeader } from '../contexts/HeaderContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Link } from '../components/ui/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showHeader, hideHeader } = useHeader();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitted(true);
      setLoading(false);
    }, 1000);
  };

    useEffect(() => {
      // Show header when component mounts
      showHeader();
  
      // Hide header when component unmounts
      return () => {
        hideHeader();
      };
    }, [showHeader, hideHeader]);

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-border text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-light text-foreground mb-4">Check Your Email</h1>
          <p className="text-muted-foreground mb-8">
            We've sent a password reset link to <strong className="text-foreground">{email}</strong>
          </p>
          <RouterLink
            to="/"
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl inline-block"
          >
            Back to Sign In
          </RouterLink>
        </div>
      </div>
    );
  }

  return (
    <ParentContainer>
      <ContentWrapper>
        <div className="text-center mb-8">
          <h1 className="text-headline-lg text-foreground">Reset your password</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/"
            variant="primary"
            underline
            leadingIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Sign In
          </Link>
        </div>
      </ContentWrapper>
    </ParentContainer>
  );
}