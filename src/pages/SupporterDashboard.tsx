import React, { useState, useEffect, useCallback } from 'react';
import { QrCode, Search, Heart, History, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import QRScanner from '../components/QRScanner';
import OverlayMenu from "../components/ui/OverlayMenu";
import NavTabs, { NavTabItem } from '../components/ui/NavTabs';
import FavoriteHeart from '../components/ui/FavoriteHeart';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Artist } from '../types';

// Updated interface for hybrid scan history
interface HybridScanHistoryItem {
  id: string;
  artist: Artist;
  scanCount: number;       // Scans on this specific day
  scanDate: Date;          // The date for this group
  isToday: boolean;        // Helper for formatting
}

export default function SupporterDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'favourited' | 'history' | 'search'>('favourited');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // State for real data
  const [artists, setArtists] = useState<Artist[]>([]);
  const [favouriteArtistIds, setFavouriteArtistIds] = useState<Set<string>>(new Set());
  const [hybridScanHistory, setHybridScanHistory] = useState<HybridScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enhanced hybrid scan history fetch with proper grouping
  const fetchHybridScanHistory = useCallback(async () => {
    console.log('fetchHybridScanHistory called for user:', user?.id);
    
    if (!user) {
      setHybridScanHistory([]);
      return;
    }

    try {
      console.log('Fetching scan history with qr_code filter');
      
      // Get scan history ordered by most recent (QR code scans only)
      const { data, error } = await supabase
        .from('scan_history')
        .select('id, artist_id, timestamp')
        .eq('supporter_id', user.id)
        .eq('scan_source', 'qr_code')
        .order('timestamp', { ascending: false });

      console.log('Query result:', data);
      console.log('Number of scans found:', data?.length || 0);

      if (error) {
        console.error('Error fetching scan history:', error);
        setHybridScanHistory([]);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No QR code scans found for user');
        setHybridScanHistory([]);
        return;
      }

      // Helper function to get date string (YYYY-MM-DD)
      const getDateString = (date: Date) => {
        return date.toISOString().split('T')[0];
      };

      // Get unique artist IDs
      const artistIds = [...new Set(data.map(scan => scan.artist_id))];
      
      if (artistIds.length === 0) {
        setHybridScanHistory([]);
        return;
      }
      
      // Fetch artist data separately
      const { data: artistsData, error: artistsError } = await supabase
        .from('users')
        .select('id, username, stage_name, profile_image_url')
        .in('id', artistIds);
        
      if (artistsError) {
        console.error('Error fetching artists data:', artistsError);
        setHybridScanHistory([]);
        return;
      }

      if (!artistsData || artistsData.length === 0) {
        setHybridScanHistory([]);
        return;
      }
      
      // Create artist lookup map
      const artistMap = new Map(artistsData.map(artist => [artist.id, artist]));

      // Group scans by artist + date combination
      const artistDateMap = new Map<string, {
        artist: Artist;
        scans: Array<{ id: string; timestamp: Date }>;
        dateKey: string;
        latestTimestamp: Date;
      }>();

      data.forEach(scan => {
        const artistId = scan.artist_id;
        const scanDate = new Date(scan.timestamp);
        const dateKey = getDateString(scanDate);
        const combinedKey = `${artistId}-${dateKey}`; // Unique key for artist + date

        const userData = artistMap.get(artistId);
        if (!userData) return; // Skip if artist not found
        
        const artist: Artist = {
          id: userData.id,
          username: userData.username,
          stageName: userData.stage_name,
          profile_image_url: userData.profile_image_url,
          isLiked: favouriteArtistIds.has(artistId)
        };

        if (artistDateMap.has(combinedKey)) {
          const existing = artistDateMap.get(combinedKey)!;
          existing.scans.push({ id: scan.id, timestamp: scanDate });
          if (scanDate > existing.latestTimestamp) {
            existing.latestTimestamp = scanDate;
          }
        } else {
          artistDateMap.set(combinedKey, {
            artist,
            scans: [{ id: scan.id, timestamp: scanDate }],
            dateKey,
            latestTimestamp: scanDate
          });
        }
      });

      // Convert to hybrid scan history items
      const hybrid: HybridScanHistoryItem[] = Array.from(artistDateMap.entries()).map(([combinedKey, data]) => {
        const today = new Date();
        const isToday = getDateString(data.latestTimestamp) === getDateString(today);

        return {
          id: combinedKey, // Using artist_id + date as unique identifier
          artist: data.artist,
          scanCount: data.scans.length,
          scanDate: data.latestTimestamp,
          isToday
        };
      });

      // Sort by scan date (most recent first)
      hybrid.sort((a, b) => b.scanDate.getTime() - a.scanDate.getTime());

      console.log('Setting hybrid scan history with', hybrid.length, 'groups, total scans:', data.length);
      setHybridScanHistory(hybrid);
    } catch (error) {
      console.error('Error fetching hybrid scan history:', error);
      // Don't set error state to avoid red box, just log the error
      // and set empty history
      setHybridScanHistory([]);
    }
  }, [user, favouriteArtistIds]);

  // Fetch artists for search
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, stage_name, profile_image_url')
          .eq('role', 'artist');

        if (error) throw error;

        const artistsWithLikeStatus = data.map(artist => ({
          ...artist,
          isLiked: favouriteArtistIds.has(artist.id)
        }));

        setArtists(artistsWithLikeStatus);
      } catch (error) {
        console.error('Error fetching artists:', error);
        setError('Failed to load artists');
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, [favouriteArtistIds]);

  // Fetch favourites
  useEffect(() => {
    const fetchFavourites = async () => {
      if (!user) {
        // Clear favorites when no user
        setFavouriteArtistIds(new Set());
        return;
      }

      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('artist_id')
          .eq('supporter_id', user.id);

        if (error) throw error;

        const favouriteIds = new Set(data?.map(fav => fav.artist_id) || []);
        console.log('Fetched favorites for user:', user.id, 'count:', favouriteIds.size);
        setFavouriteArtistIds(favouriteIds);
      } catch (error) {
        console.error('Error fetching favourites:', error);
        // Set empty set on error to avoid issues
        setFavouriteArtistIds(new Set());
      }
    };

    fetchFavourites();
  }, [user]);

  // Add function to refresh scan history when new scans occur
  const refreshScanHistory = useCallback(() => {
    console.log('refreshScanHistory called - triggering fetchHybridScanHistory');
    if (user) {
      fetchHybridScanHistory();
    }
  }, [user, fetchHybridScanHistory]);

  // Listen for scan events to refresh the history
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'scan_completed') {
        console.log('Storage event received: scan_completed');
        refreshScanHistory();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from within the same tab
    const handleScanEvent = () => {
      console.log('Custom event received: scanCompleted');
      refreshScanHistory();
    };
    
    window.addEventListener('scanCompleted', handleScanEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('scanCompleted', handleScanEvent);
    };
  }, [refreshScanHistory]);

  useEffect(() => {
    fetchHybridScanHistory();
  }, [fetchHybridScanHistory]);

  // Handle favorite toggle
  const handleFavoriteClick = async (artistId: string) => {
    if (!user) return;

    const isCurrentlyFavorited = favouriteArtistIds.has(artistId);

    try {
      if (isCurrentlyFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('supporter_id', user.id)
          .eq('artist_id', artistId);

        if (error) throw error;

        setFavouriteArtistIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(artistId);
          return newSet;
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            supporter_id: user.id,
            artist_id: artistId
          });

        if (error && error.code !== '23505') throw error;

        setFavouriteArtistIds(prev => new Set(prev).add(artistId));
      }

      // Update artists array to reflect new favorite status
      setArtists(prev => prev.map(artist => ({
        ...artist,
        isLiked: artist.id === artistId ? !isCurrentlyFavorited : artist.isLiked
      })));

      // Update hybrid scan history to reflect new favorite status
      setHybridScanHistory(prev => prev.map(item => ({
        ...item,
        artist: {
          ...item.artist,
          isLiked: item.artist.id === artistId ? !isCurrentlyFavorited : item.artist.isLiked
        }
      })));

    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Navigate to artist profile
  const navigateToArtist = (stageName: string) => {
    if (stageName) {
      navigate(`/profile/${encodeURIComponent(stageName)}`, { state: { fromInternal: true } });
    }
  };

  // Enhanced format timestamp for hybrid display
  const formatTimestamp = (date: Date, scanCount: number): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    let timeText = '';
    if (diffDays === 0) {
      timeText = 'Today';
    } else if (diffDays === 1) {
      timeText = 'Yesterday';
    } else if (diffDays < 7) {
      timeText = `${diffDays} days ago`;
    } else {
      timeText = date.toLocaleDateString();
    }

    if (scanCount === 1) {
      return `Scanned • ${timeText}`;
    } else {
      return `Scanned ${scanCount} times • ${timeText}`;
    }
  };

  // Get filtered artists for search
  const filteredArtists = artists.filter(artist =>
    artist.stageName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artist.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get favorited artists
  const favoriteArtists = artists.filter(artist => artist.isLiked);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-800">
        <Link to="/" className="text-2xl font-bold text-primary">
          HYVE
        </Link>
        <OverlayMenu onLogout={() => setShowLogoutModal(true)} />
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* QR Scanner Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowScanner(true)}
            className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            Scan QR Code
          </button>
        </div>

        {/* Tab Navigation */}
        <NavTabs
          tabs={[
            {
              id: 'favourited',
              label: 'Likes',
              icon: <Heart className="w-4 h-4" />
            },
            {
              id: 'history',
              label: 'Scans',
              icon: <History className="w-4 h-4" />
            },
            {
              id: 'search',
              label: 'Search',
              icon: <Search className="w-4 h-4" />
            }
          ]}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as 'favourited' | 'history' | 'search')}
          className="mb-6"
        />

        {/* Tab Content */}
        {activeTab === 'favourited' && (
          <div className="space-y-4">
            {favoriteArtists.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg mb-2">No favorites yet</p>
                <p className="text-gray-500">Heart artists to add them here</p>
              </div>
            ) : (
              favoriteArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="flex items-center justify-between p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-all cursor-pointer"
                  onClick={() => navigateToArtist(artist.stageName || artist.username)}
                >
                  <div className="flex items-center gap-3">
                    {artist.profile_image_url ? (
                      <img
                        src={artist.profile_image_url}
                        alt={artist.stageName || artist.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{artist.stageName || artist.username}</h3>
                      <p className="text-sm text-gray-400">@{artist.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FavoriteHeart
                      isFavorited={!!artist.isLiked}
                      size="md"
                      variant="button"
                      onClick={(e) => {
                        e?.stopPropagation();
                        handleFavoriteClick(artist.id);
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {hybridScanHistory.length === 0 ? (
              <div className="text-center py-12">
                <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg mb-2">No scans yet</p>
                <p className="text-gray-500">Start scanning QR codes to see your history</p>
              </div>
            ) : (
              hybridScanHistory.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-all cursor-pointer"
                  onClick={() => navigateToArtist(scan.artist.stageName || scan.artist.username)}
                >
                  <div className="flex items-center gap-3">
                    {scan.artist.profile_image_url ? (
                      <img
                        src={scan.artist.profile_image_url}
                        alt={scan.artist.stageName || scan.artist.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{scan.artist.stageName || scan.artist.username}</h3>
                      <div className="text-sm text-gray-400">
                        {formatTimestamp(scan.scanDate, scan.scanCount)}
                        {scan.scanCount > 1 && (
                          <div className="text-xs text-gray-500">
                            Latest: {scan.scanDate.toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FavoriteHeart
                      isFavorited={!!scan.artist.isLiked}
                      size="md"
                      variant="button"
                      onClick={(e) => {
                        e?.stopPropagation();
                        handleFavoriteClick(scan.artist.id);
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Hyve artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-primary focus:outline-none text-white placeholder-gray-400"
              />
            </div>
            
            {searchQuery && (
              <div className="space-y-4">
                {filteredArtists.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No artists found</p>
                ) : (
                  filteredArtists.map((artist) => (
                    <div
                      key={artist.id}
                      className="flex items-center justify-between p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-all cursor-pointer"
                      onClick={() => navigateToArtist(artist.stageName || artist.username)}
                    >
                      <div className="flex items-center gap-3">
                        {artist.profile_image_url ? (
                          <img
                            src={artist.profile_image_url}
                            alt={artist.stageName || artist.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">{artist.stageName || artist.username}</h3>
                          <p className="text-sm text-gray-400">@{artist.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FavoriteHeart
                          isFavorited={!!artist.isLiked}
                          size="md"
                          variant="button"
                          onClick={(e) => {
                            e?.stopPropagation();
                            handleFavoriteClick(artist.id);
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Scan QR Code</h2>
              <button
                onClick={() => setShowScanner(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <QRScanner onScan={(data) => {
              // Process scan and close modal
              console.log('Scanned:', data);
              setShowScanner(false);
              // Trigger scan completed event
              window.dispatchEvent(new Event('scanCompleted'));
            }} />
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Logout</h3>
            <p className="text-gray-400 mb-6">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-all"
              >
                Logout
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-gray-700 text-white py-2 rounded-lg hover:bg-red-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}