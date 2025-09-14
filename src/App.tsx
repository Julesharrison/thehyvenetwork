import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ArtistDashboard from "./pages/ArtistDashboard";
import SupporterDashboard from "./pages/SupporterDashboard";
import PromoterDashboard from "./pages/PromoterDashboard";
import PromoterQRCodeManagement from "./pages/PromoterQRCodeManagement";
import QRCodeDetail from "./pages/QRCodeDetail";
import TestPage from "./pages/TestPage";
import ArtistQRCodePage from "./pages/ArtistQRCodePage";
import TimePickerDemo from "./pages/TimePickerDemo";
import PublicArtistPage from "./pages/PublicArtistPage"; 
import PublicEventPage from "./pages/PublicEventPage";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardRouter from "./components/DashboardRouter";

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/event/:eventId" element={<PublicEventPage />} />
          
          {/* Main dashboard route - redirects based on user role */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            } 
          />
          
          {/* Artist routes - grouped under /artist */}
          <Route 
            path="/artist" 
            element={
              <ProtectedRoute allowedRoles={['artist']}>
                <ArtistDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/artist/qr-code" 
            element={
              <ProtectedRoute allowedRoles={['artist']}>
                <ArtistQRCodePage />
              </ProtectedRoute>
            } 
          />
          
          {/* Role-specific dashboard routes */}
          <Route 
            path="/artist-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['artist']}>
                <ArtistDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supporter-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['supporter']}>
                <SupporterDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/promoter-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['promoter']}>
                <PromoterDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected routes for specific features */}
          <Route 
            path="/promoter/qr-management" 
            element={
              <ProtectedRoute allowedRoles={['promoter']}>
                <PromoterQRCodeManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/qr/:id" 
            element={
              <ProtectedRoute>
                <QRCodeDetail />
              </ProtectedRoute>
            } 
          />
          
          {/* Development/test routes */}
          <Route path="/test" element={<TestPage />} />
          <Route path="/time-picker" element={<TimePickerDemo />} />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Public artist routes - moved to /profile/ to avoid conflicts */}
          <Route path="/profile/:stageName" element={<PublicArtistPage />} />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default App;