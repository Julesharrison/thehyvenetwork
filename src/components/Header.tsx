import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const toggleMobileMenu = () => {
    if (!isMobileMenuOpen) {
      setIsMobileMenuOpen(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsMobileMenuOpen(false), 300);
    }
  };

  return (
    <header className={`flex items-center justify-between p-6 lg:p-8 ${className || ''}`}>
      {/* Logo */}
      <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
        <span className="text-foreground text-title-lg font-medium">THE </span>
        <span className="text-primary text-title-lg font-medium">HYVE</span>
      </Link>

      {/* Menu Button - Always visible */}
      <button
        onClick={toggleMobileMenu}
        className="flex justify-center items-center w-8 h-8 group"
        aria-label="Toggle menu"
      >
        <Menu className="w-6 h-6 text-primary" />
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 backdrop-blur-sm z-40 transition-all ease-linear duration-200 ${
              isAnimating ? 'bg-background/90' : 'bg-transparent'
            }`}
            onClick={toggleMobileMenu}
          />

          {/* Menu Panel */}
          <div className={`fixed top-0 right-0 h-full w-full border-l border-border z-50 flex flex-col`}>
            {/* Close Button */}
            <div className="flex justify-end p-6 lg:p-8">
              <button
                onClick={toggleMobileMenu}
                className="flex justify-center items-center w-8 h-8"
                aria-label="Close mobile menu"
              >
                <X className="w-6 h-6 text-primary" />
              </button>
            </div>

            {/* Navigation Items - Centered */}
            <div className="flex-1 flex items-center justify-center">
              <nav className="text-center space-y-8">
                <Link
                  to="/login"
                  className="block text-body-lg text-foreground hover:text-primary transition-colors"
                  onClick={toggleMobileMenu}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="block text-body-lg text-foreground hover:text-primary transition-colors"
                  onClick={toggleMobileMenu}
                >
                  Get Started
                </Link>
              </nav>
            </div>
          </div>
        </>
      )}
    </header>
  );
}