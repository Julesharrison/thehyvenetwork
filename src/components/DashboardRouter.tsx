import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ArtistDashboard from '../pages/ArtistDashboard';
import SupporterDashboard from '../pages/SupporterDashboard';
import PromoterDashboard from '../pages/PromoterDashboard';

export default function DashboardRouter() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const userRole = user.user_metadata?.role;
  
  switch (userRole) {
    case 'artist':
      console.log('Rendering ArtistDashboard');
      return <ArtistDashboard />;
    case 'supporter':
      console.log('Rendering SupporterDashboard');
      return <SupporterDashboard />;
    case 'promoter':
      console.log('Rendering PromoterDashboard');
      return <PromoterDashboard />;
    default:
      console.log('No valid role, redirecting to login');
      return <Navigate to="/login" replace />;
  }
}