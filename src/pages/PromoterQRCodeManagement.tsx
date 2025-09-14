import React, { useState } from 'react';
import { ArrowLeft, QrCode, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { EventSeries } from '../types';

export default function PromoterQRCodeManagement() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Mock data - in real app, fetch from API
  const [eventSeries] = useState<EventSeries[]>([
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
  ]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    navigate('/');
  };

  return (
    <div className="p-4 space-y-6 bg-background min-h-screen">
      <div className="flex justify-between items-center">
        <Link
          to="/promoter"
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
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
        <h1 className="text-3xl font-bold text-foreground mb-2">QR Code Management</h1>
        <p className="text-muted-foreground">Manage QR codes for your event series</p>
      </div>

      <div className="space-y-4">
        {eventSeries.map((series) => (
          <div key={series.id} className="bg-card p-6 rounded-xl shadow-lg border border-border">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2">{series.name}</h3>
                <p className="text-muted-foreground text-sm">{series.description}</p>
              </div>
              
              <Link
                to={`/promoter/qr-codes/${series.id}`}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <QrCode className="w-5 h-5" />
                <span>View QR Code</span>
              </Link>
            </div>
          </div>
        ))}

        {eventSeries.length === 0 && (
          <div className="text-center py-12">
            <QrCode className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No event series yet</h3>
            <p className="text-muted-foreground mb-6">Create an event series to generate QR codes</p>
            <Link
              to="/promoter"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
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