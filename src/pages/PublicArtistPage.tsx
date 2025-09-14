import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { QrCode } from 'lucide-react';
import { SocialLinks, getSocialLink, formatSocialUrl } from '../types';
import FavoriteHeart from '../components/ui/FavoriteHeart';

// Import your brand SVGs
import InstagramLogo from '../assets/brands/instagram.svg';
import TikTokLogo from '../assets/brands/tiktok.svg';
import SnapchatLogo from '../assets/brands/snapchat.svg';
import YoutubeLogo from '../assets/brands/youtube.svg';
import SpotifyLogo from '../assets/brands/spotify.svg';
import CustomUrlLogo from '../assets/brands/customurl.svg';
import UploadImageLogo from '../assets/brands/uploadimage.svg';

interface ArtistProfile {
  id: string;
  profile_image_url: string | null;
  stage_name: string;
  username: string;
  social_links: SocialLinks;
}

export default function PublicArtistPage() {
  const { stageName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [scanInfo, setScanInfo] = useState<{count: number, lastScanned: Date | null}>({count: 0, lastScanned: null});
  const [favouriteArtistIds, setFavouriteArtistIds] = useState<Set<string>>(new Set());

  // Ref to track timeout for cleanup
  const snackbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hex grid layout constants
  const hexRadius = 35;
  const rowPadding = 40;
  const sideColumnOffsetY = 16;
  const centerX = 180;
  const columnSpacing = 80;

  const columns = React.useMemo(() => [
    { x: centerX - columnSpacing, labels: ['LEFT TOP', 'LEFT BOTTOM'] },
    { x: centerX, labels: ['TOP', 'CENTER', 'BOTTOM'] },
    { x: centerX + columnSpacing, labels: ['RIGHT TOP', 'RIGHT BOTTOM'] },
  ], [centerX, columnSpacing]);

  // Load scan information for logged-in users
  const loadScanInfo = useCallback(async () => {
    if (!user?.id || !artist?.id) return;

    try {
      const { data, error } = await supabase
        .from('scan_history')
        .select('timestamp')
        .eq('supporter_id', user.id)
        .eq('artist_id', artist.id)
        .eq('scan_source', 'qr_code')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error loading scan info:', error);
        return;
      }

      const count = data.length;
      const lastScanned = count > 0 ? new Date(data[0].timestamp) : null;
      
      setScanInfo({ count, lastScanned });
    } catch (error) {
      console.error('Error loading scan info:', error);
    }
  }, [user?.id, artist?.id]);

  useEffect(() => {
    loadScanInfo();
  }, [loadScanInfo]);

  // Track scan when page loads
  useEffect(() => {
    const trackScan = async () => {
      if (!artist || !stageName) return;

      console.log('=== SCAN TRACKING DEBUG ===');
      console.log('location.state:', location.state);
      console.log('location.state?.fromInternal:', location.state?.fromInternal);
      
      // Determine scan source based on user type
      let scanSource;
      if (!user) {
        // Anonymous user - use referrer detection as fallback
        const referrer = document.referrer;
        const isFromExternal = !referrer || !referrer.includes(window.location.hostname);
        scanSource = isFromExternal ? 'qr_code' : 'clicked';
        console.log('Anonymous user - using referrer:', referrer);
        console.log('Is from external (referrer):', isFromExternal);
      } else {
        // Logged-in user - use navigation state
        const isFromExternalSource = !location.state?.fromInternal;
        scanSource = isFromExternalSource ? 'qr_code' : 'clicked';
        console.log('Logged-in user - using navigation state');
        console.log('isFromExternalSource:', isFromExternalSource);
      }
      
      console.log('scanSource:', scanSource);
      console.log('Current URL:', window.location.href);
      console.log('Navigation type:', performance.navigation?.type);
      console.log('========================');

      if (user?.id) {
        try {
          const { data: recentScan, error: checkError } = await supabase
            .from('scan_history')
            .select('id, timestamp')
            .eq('supporter_id', user.id)
            .eq('artist_id', artist.id)
            .gte('timestamp', new Date(Date.now() - 60000).toISOString())
            .limit(1);
          
          if (checkError) {
            console.error('Error checking for recent scan:', checkError);
          }
          
          if (!recentScan || recentScan.length === 0) {
            const insertData = {
              supporter_id: user.id,
              artist_id: artist.id,
              timestamp: new Date().toISOString(),
              scan_source: scanSource
            };
            
            console.log('Inserting scan data:', insertData);
            
            const { error: scanError } = await supabase
              .from('scan_history')
              .insert(insertData);
            
            if (scanError) {
              console.error('Error saving scan to database:', scanError);
            } else {
              console.log('Scan saved successfully with source:', scanSource);
              setTimeout(() => {
                loadScanInfo();
              }, 250);
            }
          }
        } catch (error) {
          console.error('Error tracking logged-in user scan:', error);
        }
      } else {
        try {
          const anonymousScans = JSON.parse(localStorage.getItem('anonymous_scans') || '[]');
          
          const recentScan = anonymousScans.find((scan: any) => 
            scan.artistId === artist.id && 
            (new Date().getTime() - new Date(scan.timestamp).getTime()) < 60000
          );
          
          if (!recentScan) {
            const newAnonymousScan = {
              artistId: artist.id,
              artistUsername: artist.username,
              artistStageName: artist.stage_name,
              artistProfileImage: artist.profile_image_url,
              timestamp: new Date().toISOString()
            };
            
            anonymousScans.unshift(newAnonymousScan);
            
            if (anonymousScans.length > 50) {
              anonymousScans.splice(50);
            }
            
            localStorage.setItem('anonymous_scans', JSON.stringify(anonymousScans));
            
            const scanCount = anonymousScans.length;
            setDiscoveredCount(scanCount);
            
            if (scanCount === 3 || scanCount === 5 || scanCount === 10) {
              setTimeout(() => setShowSignupPrompt(true), 2000);
            }
          }
        } catch (error) {
          console.error('Error tracking anonymous scan:', error);
        }
      }
    };

    trackScan();
  }, [artist, user, stageName, loadScanInfo]);

  // Fetch artist data
  useEffect(() => {
    const fetchArtistData = async () => {
      if (!stageName) return;

      try {
        const normalizedStageName = decodeURIComponent(stageName).toLowerCase();

        const { data: artistData, error } = await supabase
          .from('users')
          .select('id, username, stage_name, profile_image_url, social_links')
          .ilike('stage_name', normalizedStageName)
          .eq('role', 'artist')
          .single();

        if (error || !artistData) {
          console.error('Artist not found:', error);
          setNotFound(true);
          setLoading(false);
          return;
        }

        const artistProfile: ArtistProfile = {
          id: artistData.id,
          profile_image_url: artistData.profile_image_url,
          stage_name: artistData.stage_name,
          username: artistData.username,
          social_links: artistData.social_links || {}
        };

        setArtist(artistProfile);

      } catch (error) {
        console.error('Failed to fetch artist data:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [stageName]);

  // Fetch favourites
  useEffect(() => {
    const fetchFavourites = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            id,
            artist_id,
            created_at,
            users!inner(id, username, stage_name, profile_image_url)
          `)
          .eq('supporter_id', user.id);

        if (error) throw error;

        const favouriteIds = new Set(data.map(fav => fav.artist_id));
        setFavouriteArtistIds(favouriteIds);
      } catch (error) {
        console.error('Error fetching favourites:', error);
      }
    };

    fetchFavourites();
  }, [user?.id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (snackbarTimeoutRef.current) {
        clearTimeout(snackbarTimeoutRef.current);
      }
    };
  }, []);

  // Check if user has favorited this artist
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user?.id || !artist?.id) return;

      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('supporter_id', user.id)
          .eq('artist_id', artist.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking favorite status:', error);
          setIsFavorited(false);
        } else {
          setIsFavorited(!!data);
        }
      } catch (error) {
        console.error('Failed to check favorite status:', error);
        setIsFavorited(false);
      }
    };

    checkFavoriteStatus();
  }, [user?.id, artist?.id]);

  // Show snackbar with auto-hide and proper cleanup
  const showSnackbarMessage = useCallback((message: string) => {
    if (snackbarTimeoutRef.current) {
      clearTimeout(snackbarTimeoutRef.current);
    }
    
    setSnackbarMessage(message);
    setShowSnackbar(true);
    
    snackbarTimeoutRef.current = setTimeout(() => {
      setShowSnackbar(false);
      snackbarTimeoutRef.current = null;
    }, 3000);
  }, []);

  // Handle favorite toggle
  const handleFavoriteClick = async () => {
    if (!user) {
      showSnackbarMessage('Sign in as a supporter to favorite artists');
      return;
    }

    if (!artist) return;

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('supporter_id', user.id)
          .eq('artist_id', artist.id);

        if (error) {
          console.error('Error removing favorite:', error);
          showSnackbarMessage('Failed to remove favorite');
        } else {
          setIsFavorited(false);
          showSnackbarMessage('Removed from favorites');
        }
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            supporter_id: user.id,
            artist_id: artist.id
          });

        if (error) {
          if (error.code === '23505') {
            setIsFavorited(true);
            showSnackbarMessage('Already in favorites');
          } else {
            console.error('Error adding favorite:', error);
            showSnackbarMessage('Failed to add favorite');
          }
        } else {
          setIsFavorited(true);
          showSnackbarMessage('Added to favorites');
        }
      }
    } catch (error) {
      console.error('Favorite operation failed:', error);
      showSnackbarMessage('Something went wrong');
    }
  };

  // Helper to get social link from JSON
  const getArtistSocialLink = (platform: string) => {
    return getSocialLink(artist?.social_links, platform as keyof SocialLinks);
  };

  // Helper to get brand logo
  const getBrandLogo = (platform: string) => {
    switch (platform) {
      case 'instagram': return InstagramLogo;
      case 'tiktok': return TikTokLogo;
      case 'snapchat': return SnapchatLogo;
      case 'youtube': return YoutubeLogo;
      case 'spotify': return SpotifyLogo;
      case 'custom': return CustomUrlLogo;
      case 'profile': return UploadImageLogo;
      default: return null;
    }
  };

  const renderPlatformIcon = (platform: string, i: number) => {
    const brandLogo = getBrandLogo(platform);
    if (brandLogo) {
      return (
        <image
          href={brandLogo}
          x="14"
          y="10"
          width="60"
          height="60"
          clipPath={`url(#hex-clip-${platform}-${i})`}
        />
      );
    }
    return null;
  };

  // Handle hex cell click using JSON social links
  const handleHexClick = (platform: string) => {
    if (platform === 'profile') {
      return;
    }

    const url = getArtistSocialLink(platform);
    if (url && url.trim() !== '') {
      const formattedUrl = formatSocialUrl(url);
      if (formattedUrl) {
        window.open(formattedUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Helper to format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Loading state
  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gray-700 rounded-full mb-4"></div>
          <div className="w-32 h-6 bg-gray-700 rounded"></div>
        </div>
        <p className="mt-4 text-gray-400">Loading artist profile...</p>
      </main>
    );
  }

  // Not found state
  if (notFound || !artist) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Artist Not Found</h1>
          <p className="text-gray-400 mb-6">
            The artist "{stageName}" could not be found.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-all"
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center gap-6 bg-black min-h-screen p-6 text-white">
      {/* Header with back button only */}
      <div className="w-full flex justify-start items-center">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          ← Back
        </button>
      </div>

      {/* Artist Name */}
      <h1 className="text-3xl font-bold text-center mb-6 tracking-wide">
        {artist.stage_name}
      </h1>

      {/* Scan Counter for Logged-in Users */}
      {user && scanInfo.count > 0 && (
        <div className="text-center mb-4">
          <p className="text-primary text-sm font-medium">
            Scanned {scanInfo.count} time{scanInfo.count !== 1 ? 's' : ''}
          </p>
          {scanInfo.lastScanned && (
            <p className="text-gray-400 text-xs">
              Last visit: {formatTimeAgo(scanInfo.lastScanned)}
            </p>
          )}
        </div>
      )}

      {/* Hex Grid */}
      <div className="relative w-[360px] h-[360px] flex items-center justify-center">
        {/* Favorite Button */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-10">
          <FavoriteHeart
            isFavorited={isFavorited}
            variant="hexagon"
            onClick={handleFavoriteClick}
          />
        </div>
        {columns.map((col, colIndex) => {
          const hexHeight = hexRadius * 2;
          const colCount = col.labels.length;
          const colTotalHeight = (hexHeight * 0.75) * (colCount - 1) + hexHeight;
          const centerColumnCount = columns[1].labels.length;
          const centerColumnTotalHeight = (hexHeight * 0.75) * (centerColumnCount - 1) + hexHeight;
          let startY = (centerColumnTotalHeight - colTotalHeight) / 2 + 40;
          if (colIndex !== 1) startY += sideColumnOffsetY;

          return col.labels.map((_, i) => {
            let platform = '';
            if (colIndex === 0) platform = i === 0 ? 'instagram' : 'youtube';
            if (colIndex === 1) platform = i === 0 ? 'tiktok' : i === 1 ? 'profile' : 'spotify';
            if (colIndex === 2) platform = i === 0 ? 'snapchat' : 'custom';

            const socialLink = getArtistSocialLink(platform);
            const hasUrl = socialLink && socialLink.trim() !== '';
            const isClickable = hasUrl && platform !== 'profile';
            const cy = startY + i * (hexHeight * 0.75 + rowPadding);

            return (
              <div
                key={`${platform}-${i}`}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform transition-opacity duration-300 ${
                  isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                }`}
                style={{
                  left: col.x,
                  top: cy,
                  width: '88px',
                  height: '80px',
                  opacity: hasUrl || platform === 'profile' ? 1 : 0.4,
                }}
                onClick={() => handleHexClick(platform)}
                title={
                  platform === 'profile' 
                    ? artist.stage_name || artist.username
                    : hasUrl 
                      ? `Visit ${platform}` 
                      : `${platform} (not set)`
                }
              >
                <svg viewBox="0 0 88 80" className="w-full h-full shadow-lg">
                  <defs>
                    <clipPath id={`hex-clip-${platform}-${i}`}>
                      <path d="M2.29395 43.1328C1.22115 41.1823 1.22115 38.8177 2.29395 36.8672L20.4434 3.86719C21.5857 1.79031 23.7683 0.500082 26.1387 0.5H61.8613C64.2317 0.500082 66.4143 1.79031 67.5566 3.86719L85.7061 36.8672C86.7788 38.8177 86.7789 41.1823 85.7061 43.1328L67.5566 76.1328C66.4143 78.2097 64.2317 79.4999 61.8613 79.5H26.1387C23.7683 79.4999 21.5857 78.2097 20.4434 76.1328L2.29395 43.1328Z" />
                    </clipPath>
                  </defs>

                  {platform === 'profile' && artist.profile_image_url ? (
                    <image
                      href={artist.profile_image_url}
                      width="88"
                      height="80"
                      preserveAspectRatio="xMidYMid slice"
                      clipPath={`url(#hex-clip-${platform}-${i})`}
                      className="rounded-lg"
                    />
                  ) : platform === 'profile' ? (
                    <rect width="88" height="80" fill="hsl(var(--primary))" clipPath={`url(#hex-clip-${platform}-${i})`} />
                  ) : (
                    renderPlatformIcon(platform, i)
                  )}

                  <path
                    d="M2.29395 43.1328C1.22115 41.1823 1.22115 38.8177 2.29395 36.8672L20.4434 3.86719C21.5857 1.79031 23.7683 0.500082 26.1387 0.5H61.8613C64.2317 0.500082 66.4143 1.79031 67.5566 3.86719L85.7061 36.8672C86.7788 38.8177 86.7789 41.1823 85.7061 43.1328L67.5566 76.1328C66.4143 78.2097 64.2317 79.4999 61.8613 79.5H26.1387C23.7683 79.4999 21.5857 78.2097 20.4434 76.1328L2.29395 43.1328Z"
                    fill="transparent"
                    stroke={hasUrl || platform === 'profile' ? 'hsl(var(--primary))' : 'gray'}
                    strokeWidth={2.5}
                  />
                </svg>
              </div>
            );
          });
        })}
      </div>

      {/* Bottom tagline */}
      <div className="w-full flex justify-center items-center mb-6 mt-auto">
        <p className="text-xl font-bold tracking-widest text-primary">BUILD.SHARE.DISCOVER</p>
      </div>

      {/* Artist info section */}
      <div className="text-center -mt-4 space-y-2 flex flex-col items-center">
        <p className="text-gray-400 text-sm">
          Click on the platforms above to visit {artist.stage_name || artist.username}'s profiles
        </p>
        {Object.values(artist.social_links || {}).filter(link => link && link.trim() !== '').length === 0 && (
          <p className="text-gray-500 text-sm italic">
            No social links available yet
          </p>
        )}
      </div>

      {/* Snackbar */}
      {showSnackbar && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-300 opacity-100">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg">
            {snackbarMessage}
          </div>
        </div>
      )}

      {/* Signup Prompt Modal */}
      {showSignupPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                You've discovered {discoveredCount} artists!
              </h3>
              <p className="text-muted-foreground mb-6">
                Don't lose these discoveries! Sign up now to save them permanently and sync across all your devices.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowSignupPrompt(false);
                    navigate('/signup');
                  }}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all"
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setShowSignupPrompt(false)}
                  className="flex-1 bg-muted text-muted-foreground py-3 rounded-lg font-semibold hover:bg-accent transition-all"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
