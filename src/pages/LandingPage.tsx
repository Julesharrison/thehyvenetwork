import React, { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Link } from '../components/ui/link';
import { useHeader } from '../contexts/HeaderContext';
import ParentContainer from '../components/ParentContainer';
import ContentWrapper from '../components/ContentWrapper';

export default function LandingPage() {
  const { showHeader, hideHeader } = useHeader();

  useEffect(() => {
    // Show header when component mounts
    showHeader();

    // Hide header when component unmounts
    return () => {
      hideHeader();
    };
  }, [showHeader, hideHeader]);

  return (
    <ParentContainer>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 lg:px-8 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Hero Heading */}
          <h1 className="text-hero-lg text-foreground leading-tight">
            A catchy value prop goes here.
          </h1>

          {/* Description */}
          <p className="text-body-lg text-foreground max-w-xl mx-auto leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut et massa mi. Aliquam in
            hendrerit urna. Pellentesque sit amet sapien fringilla, mattis ligula consectetur,
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 justify-center items-center mt-12">
            <Button asChild className="w-full sm:w-auto min-w-[200px]">
              <RouterLink to="/signup">Get Started</RouterLink>
            </Button>

            <Link
              to="/login"
              variant="primary"
              underline
            >
              I already have an account
            </Link>
          </div>
        </div>
      </main>

      {/* Footer spacing */}
      <div className="h-16"></div>
    </ParentContainer>
  );
}