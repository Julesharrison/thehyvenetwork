import React, { useState } from 'react';
import { ArrowLeft, Download, Share2, LogOut } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { EventSeries } from '../types';
import QRCodeGenerator from '../components/QRCodeGenerator';

export default function QRCodeDetail() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Mock data - in real app, fetch from API
  const eventSeries: EventSeries[] = [
    { 
      id: '1', 
      name: 'Friday Nights @ Club One', 
      description: 'Weekly electronic music nights at Club One downtown',
      promoterId: '1' 
    },
    { 
      id: '2', 
      name: 'Underground Sessions', 
      description: 'Monthly underground hip-hop showcase at The Warehouse',
      promoterId: '1' 
    },
    { 
      id: '3', 
      name: 'Summer Concert Series', 
      description: 'Outdoor concerts in Central Park every Saturday',
      promoterId: '1' 
    }
  ];

  const series = eventSeries.find(s => s.id === seriesId);

  if (!series) {
    return (
      <div className="p-4 space-y-6 bg-background min-h-screen">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">Series Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested event series could not be found.</p>
          <Link
            to="/promoter/qr-codes"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
          >
            Back to QR Management
          </Link>
        </div>
      </div>
    );
  }

  const getEventSeriesUrl = (seriesId: string) => {
    return `${window.location.origin}/series/${seriesId}`;
  };

  const handleDownloadQR = () => {
    // Placeholder for download functionality
    alert('Download QR functionality would be implemented here');
  };

  const handleShareQR = () => {
    // Placeholder for share functionality
    if (navigator.share) {
      navigator.share({
        title: `${series.name} - QR Code`,
        text: `Check out ${series.name}`,
        url: getEventSeriesUrl(series.id)
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(getEventSeriesUrl(series.id));
      alert('Series URL copied to clipboard!');
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    navigate('/');
  };

  return (
    <div className="p-4 space-y-6 bg-background min-h-screen">
      <div className="flex justify-between items-center">
        <Link
          to="/promoter/qr-codes"
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to QR Management</span>
        </Link>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-primary/20 hover:text-primary transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">{series.name}</h1>
        <p className="text-muted-foreground">{series.description}</p>
      </div>

      <div className="bg-card p-8 rounded-xl shadow-lg border border-border text-center">
        <div className="mb-6 flex justify-center">
          <QRCodeGenerator value={getEventSeriesUrl(series.id)} />
        </div>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-foreground mb-2">{series.name}</h3>
          <p className="text-muted-foreground">{series.description}</p>
        </div>

        <div className="flex space-x-4 justify-center mb-6">
          <button
            onClick={handleDownloadQR}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Download QR</span>
          </button>
          <button
            onClick={handleShareQR}
            className="border border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-all flex items-center space-x-2"
          >
            <Share2 className="w-5 h-5" />
            <span>Share QR</span>
          </button>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>This QR code never changes.</strong> Update your events inside this series, 
            and supporters will always see the latest lineup.
          </p>
        </div>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-medium text-foreground text-center mb-4">
              Are you sure you want to log out?
            </h3>
            <div className="flex space-x-3">
              <button
                onClick={handleLogout}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all"
              >
                Yes
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 border border-border text-muted-foreground py-3 rounded-lg hover:bg-muted transition-all"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}