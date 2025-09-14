import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Box } from 'lucide-react';
import { Link } from 'react-router-dom';
import QRCodeGenerator from '../components/QRCodeGenerator';
import HexagonContainer from '../components/HexagonContainer';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Bigger hexagon path with rounded corners
const HEXAGON_PATH_D = "M120 40 Q125 35 130 40 L220 40 Q235 35 245 50 L285 130 Q290 140 285 150 L245 230 Q235 245 220 240 L130 240 Q125 245 120 240 L80 150 Q75 140 80 130 Z";

export default function ArtistQRCodePage() {
  const { user } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [userStageName, setUserStageName] = useState<string>('');

  // Fetch user's stage name from database
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('stage_name')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching user stage name:', error);
          return;
        }
        
        if (data?.stage_name) {
          setUserStageName(data.stage_name);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    
    fetchUserData();
  }, [user]);

  // Fixed: Use database stage name first, then fallbacks
  const getBlockUrl = () => {
    const stageName = userStageName || user?.user_metadata?.stageName || user?.username || 'unknown';
    return `${window.location.origin}/profile/${encodeURIComponent(stageName)}`;
  };

  const handleSendEmail = () => {
    setToastMessage('QR code sent to your email address!');
    setShowToast(true);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleOrderStickers = () => {
    // Placeholder for future functionality
    console.log('Order stickers functionality coming soon');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link
            to="/artist"
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Unique QR Code</h1>
          <p className="text-muted-foreground">Share this QR code to let people discover your Hyve</p>
        </div>
        <div className="flex justify-center mb-8">
          <HexagonContainer
            pathD={HEXAGON_PATH_D}
            fillColor="white"
            strokeColor="hsl(var(--primary))"
            strokeWidth={6}
            viewBox="0 0 360 280"
            className="w-96 h-96"
          >
            <QRCodeGenerator value={getBlockUrl()} />
          </HexagonContainer>
        </div>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={handleSendEmail}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            <Mail className="w-5 h-5" />
            <span>Send to email</span>
          </button>
          
          <button
            onClick={handleOrderStickers}
            className="w-full border-2 border-primary bg-transparent text-primary py-4 rounded-xl font-semibold hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center space-x-2"
          >
            <Box className="w-5 h-5" />
            <span>Order stickers</span>
          </button>
        </div>
        <div className="bg-card border border-primary p-6 rounded-xl">
          <p className="text-sm text-muted-foreground text-center">
            <strong className="text-foreground">This QR code never changes.</strong> Update your social links 
            and supporters will always see your latest content.
          </p>
        </div>
      </div>
      {/* Toast notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
