import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Optional: restrict to specific roles
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  
  // Show loading while checking auth
  if (loading) {
    return <div>Loading...</div>; // You can replace with a proper loading component
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has required role (if specified)
  if (allowedRoles && user.user_metadata?.role) {
    const userRole = user.user_metadata.role;
    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on their actual role
      return <Navigate to={`/${userRole}-dashboard`} replace />;
    }
  }
  
  return <>{children}</>;
}