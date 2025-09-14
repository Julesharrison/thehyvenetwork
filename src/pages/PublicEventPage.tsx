import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, User, Music } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PublicEventArtist {
  id: string;
  artistId: string | null;
  artistName: string;
  performanceTime: string | null;
  isRegistered: boolean;
  stageName?: string;
  username?: string;
  profileImageUrl?: string;
}

interface PublicEvent {
  id: string;
  title: string;
  location: string;
  date: Date;
  artists: PublicEventArtist[];
  promoterName?: string;
}

export default function PublicEventPage() {
  // Helper function to convert 12-hour time to minutes for accurate sorting
  const timeToMinutes = (timeString: string): number => {
    if (!timeString) return 9999; // Put empty times at the end
    
    try {
      // Handle various time formats
      const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!timeMatch) {
        // Try to parse without AM/PM (assume 24-hour format)
        const time24Match = timeString.match(/(\d{1,2}):(\d{2})/);
        if (!time24Match) return 9999;
        
        const hours = parseInt(time24Match[1]);
        const minutes = parseInt(time24Match[2]);
        return hours * 60 + minutes;
      }
      
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3].toUpperCase();
      
      // Convert to 24-hour format
      if (period === 'AM' && hours === 12) {
        hours = 0; // 12:xx AM becomes 0:xx
      } else if (period === 'PM' && hours !== 12) {
        hours += 12; // x:xx PM becomes (x+12):xx, except 12:xx PM stays 12:xx
      }
      
      return hours * 60 + minutes;
    } catch (error) {
      console.warn('Failed to parse time:', timeString);
      return 9999; // Put unparseable times at the end
    }
  };

  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchPublicEvent();
      trackEventView();
    }
  }, [eventId]);

  const fetchPublicEvent = async () => {
    try {
      setLoading(true);
      
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          location,
          date,
          is_public,
          promoter_id,
          users!events_promoter_id_fkey (username),
          event_artists (
            id,
            artist_id,
            artist_name_text,
            performance_time,
            users:artist_id (
              id,
              username,
              stage_name,
              profile_image_url
            )
          )
        `)
        .eq('id', eventId)
        .eq('is_public', true)
        .single();

      if (eventError) {
        if (eventError.code === 'PGRST116') {
          setError('Event not found or not public');
        } else {
          throw eventError;
        }
        return;
      }

      if (!eventData) {
        setError('Event not found or not public');
        return;
      }

      const processedArtists: PublicEventArtist[] = (eventData.event_artists || [])
        .map((ea: any) => {
          const isRegistered = !!(ea.artist_id && ea.users);
          const artistName = isRegistered 
            ? (ea.users.stage_name || ea.users.username)
            : (ea.artist_name_text || 'Unknown Artist');

          return {
            id: ea.id,
            artistId: ea.artist_id,
            artistName,
            performanceTime: ea.performance_time,
            isRegistered,
            stageName: isRegistered ? ea.users.stage_name : undefined,
            username: isRegistered ? ea.users.username : undefined,
            profileImageUrl: isRegistered ? ea.users.profile_image_url : undefined,
          };
        })
        .sort((a, b) => {
          // Convert times to minutes for proper chronological sorting
          const timeA = timeToMinutes(a.performanceTime || '');
          const timeB = timeToMinutes(b.performanceTime || '');
          
          // Primary sort: by performance time
          if (timeA !== timeB) {
            return timeA - timeB;
          }
          
          // Secondary sort: alphabetically by artist name if times are equal
          return a.artistName.localeCompare(b.artistName);
        });

      const publicEvent: PublicEvent = {
        id: eventData.id,
        title: eventData.title,
        location: eventData.location,
        date: new Date(eventData.date),
        artists: processedArtists,
        promoterName: (eventData.users as any)?.username,
      };

      setEvent(publicEvent);
    } catch (err: any) {
      console.error('Error fetching public event:', err);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const trackEventView = async () => {
    try {
      await supabase.from('event_views').insert({
        event_id: eventId,
        is_authenticated: !!user,
        user_id: user?.id || null,
      });
    } catch (err) {
      console.log('Analytics tracking failed:', err);
    }
  };

  const handleArtistClick = (artist: PublicEventArtist) => {
    if (artist.isRegistered && artist.username) {
      const profileName = artist.stageName || artist.username;
      const url = `/profile/${encodeURIComponent(profileName)}`;
      navigate(url);
    }
  };

  const formatEventDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatEventTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Event Not Available
          </h2>
          <p className="text-muted-foreground mb-4">
            {error || 'This event is not publicly accessible or may have been removed.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="p-4">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {event.title}
            </h1>
            <div className="flex flex-wrap justify-center items-center gap-4 text-muted-foreground">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{event.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{formatEventDate(event.date)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{formatEventTime(event.date)}</span>
              </div>
            </div>
            {event.promoterName && (
              <p className="text-xs text-muted-foreground mt-2">
                Presented by {event.promoterName?.charAt(0).toUpperCase() + event.promoterName?.slice(1)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 pb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center space-x-2">
            <Music className="w-5 h-5" />
            <span>Setlist</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            {event.artists.length} artist{event.artists.length !== 1 ? 's' : ''} performing
          </p>
        </div>

        {event.artists.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No Artists Listed</h3>
            <p className="text-muted-foreground">
              The setlist for this event hasn't been finalized yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {event.artists.map((artist) => (
              <div
                key={artist.id}
                onClick={() => handleArtistClick(artist)}
                className={`
                  bg-card border border-border rounded-lg p-4 transition-all
                  ${artist.isRegistered 
                    ? 'hover:bg-accent/50 cursor-pointer hover:border-primary/50' 
                    : ''
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {artist.isRegistered && artist.profileImageUrl ? (
                        <div className="relative w-12 h-12">
                          <svg viewBox="0 0 48 48" className="w-full h-full">
                            <defs>
                              <clipPath id={`hex-clip-${artist.id}`}>
                                <path d="M1.24 23.46C0.67 22.43 0.67 21.17 1.24 20.14L10.46 3.95C11.08 2.79 12.39 2.09 13.8 2.09H32.2C33.61 2.09 34.92 2.79 35.54 3.95L44.76 20.14C45.33 21.17 45.33 22.43 44.76 23.46L35.54 39.65C34.92 40.81 33.61 41.51 32.2 41.51H13.8C12.39 41.51 11.08 40.81 10.46 39.65L1.24 23.46Z" />
                              </clipPath>
                            </defs>
                            <image
                              href={artist.profileImageUrl}
                              width="48"
                              height="48"
                              preserveAspectRatio="xMidYMid slice"
                              clipPath={`url(#hex-clip-${artist.id})`}
                            />
                            <path
                              d="M1.24 23.46C0.67 22.43 0.67 21.17 1.24 20.14L10.46 3.95C11.08 2.79 12.39 2.09 13.8 2.09H32.2C33.61 2.09 34.92 2.79 35.54 3.95L44.76 20.14C45.33 21.17 45.33 22.43 44.76 23.46L35.54 39.65C34.92 40.81 33.61 41.51 32.2 41.51H13.8C12.39 41.51 11.08 40.81 10.46 39.65L1.24 23.46Z"
                              fill="transparent"
                              stroke="hsl(var(--primary))"
                              strokeWidth="2"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className={`
                          w-12 h-12 rounded-full flex items-center justify-center
                          ${artist.isRegistered 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                          }
                        `}>
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`
                          font-semibold truncate
                          ${artist.isRegistered ? 'text-primary' : 'text-foreground'}
                        `}>
                          {artist.artistName}
                        </h3>
                        <div className={`
                          w-2 h-2 rounded-full flex-shrink-0
                          ${artist.isRegistered ? 'bg-green-500' : 'bg-gray-400'}
                        `} />
                      </div>
                      
                      {artist.isRegistered && artist.username && (
                        <p className="text-sm text-muted-foreground truncate">
                          @{artist.username}
                        </p>
                      )}
                      
                      {!artist.isRegistered && (
                        <p className="text-xs text-muted-foreground">
                          Custom Artist
                        </p>
                      )}
                    </div>
                  </div>

                  {artist.performanceTime && (
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="flex items-center space-x-1 text-sm font-medium text-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{artist.performanceTime}</span>
                      </div>
                    </div>
                  )}
                </div>

                {artist.isRegistered && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-xs text-primary">
                      Tap to view profile
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Powered by Hyve
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            Discover more artists
          </button>
        </div>
      </div>
    </div>
  );
}
