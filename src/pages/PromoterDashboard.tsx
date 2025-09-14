import React, { useEffect, useState, useRef } from 'react';
import {
  Plus,
  Calendar,
  MapPin,
  Clock,
  Edit3,
  Trash2,
  CalendarDays,
  QrCode,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import OverlayMenu from "../components/ui/OverlayMenu";
import ArtistSearchSelector from '../components/ArtistSearchSelector';
import QRCodeGenerator from '../components/QRCodeGenerator';
import CustomTimePicker from '../components/CustomTimePicker';

type SelectedArtist = {
  id?: string;
  artistName: string;
  performanceTime: string;
  isRegistered: boolean;
};

type UIEvent = {
  id: string;
  title: string;
  location: string;
  date: Date;
  promoter_id: string;
  is_public: boolean;
  qr_code_url?: string;
  promoterName?: string;
  artists: Array<{
    id: string;
    eventId: string;
    artistId: string | null;
    artistName: string;
    performanceTime: string;
    isRegistered: boolean;
  }>;
};

export default function PromoterDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const promoterId = user?.id;
  const editFormRef = useRef<HTMLDivElement>(null);

  // Helper function to convert 12-hour time to minutes for accurate sorting
  const timeToMinutes = (timeString: string): number => {
    if (!timeString) return -1; // Put empty times at the beginning
    
    try {
      // Handle various time formats
      const timeMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!timeMatch) {
        // Try to parse without AM/PM (assume 24-hour format)
        const time24Match = timeString.match(/(\d{1,2}):(\d{2})/);
        if (!time24Match) return -1;
        
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
      return -1; // Put unparseable times at the beginning
    }
  };

  const [events, setEvents] = useState<UIEvent[]>([]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [editingEventData, setEditingEventData] = useState<UIEvent | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState<string | null>(null);

  const [newEvent, setNewEvent] = useState<{
    title: string;
    location: string;
    date: Date | undefined;
    time: string;
    artists: SelectedArtist[];
  }>({
    title: '',
    location: '',
    date: undefined,
    time: '08:00 PM',
    artists: [],
  });

  const [editingArtists, setEditingArtists] = useState<SelectedArtist[]>([]);
  const [editingTime, setEditingTime] = useState('08:00 PM');

  const fetchEvents = async () => {
    if (!promoterId) return;
    const { data, error } = await supabase
      .from('events')
      .select(`
        *, 
        users!events_promoter_id_fkey (username),
        event_artists (
          id,
          artist_id,
          artist_name_text,
          performance_time,
          users:artist_id (
            id,
            username,
            stage_name
          )
        )
      `)
      .eq('promoter_id', promoterId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      return;
    }

    const mapped: UIEvent[] = (data || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      location: e.location,
      date: new Date(e.date),
      promoter_id: e.promoter_id,
      is_public: e.is_public || false,
      qr_code_url: e.qr_code_url,
      promoterName: (e.users as any)?.username,
      artists: (e.event_artists || []).map((ea: any) => {
        const isRegistered = !!(ea.artist_id && ea.users);
        const artistName = isRegistered 
          ? (ea.users.stage_name || ea.users.username)
          : (ea.artist_name_text || 'Unknown Artist');

        return {
          id: ea.id,
          eventId: ea.event_id,
          artistId: ea.artist_id,
          artistName,
          performanceTime: ea.performance_time || '',
          isRegistered,
        };
      }).sort((a: any, b: any) => {
        // Convert times to minutes for proper chronological sorting
        const timeA = timeToMinutes(a.performanceTime || '');
        const timeB = timeToMinutes(b.performanceTime || '');
        
        // Primary sort: by performance time
        if (timeA !== timeB) {
          return timeA - timeB;
        }
        
        // Secondary sort: alphabetically by artist name if times are equal
        return a.artistName.localeCompare(b.artistName);
      }),
    }));

    setEvents(mapped);
  };

  useEffect(() => {
    fetchEvents();
  }, [promoterId]);

  const handleCreateEvent = async () => {
    if (!promoterId) return;
    if (!newEvent.title.trim() || !newEvent.location.trim() || !newEvent.date || !newEvent.time) return;

    const timeMatch = newEvent.time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!timeMatch) {
      console.error('Invalid time format');
      return;
    }

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const period = timeMatch[3].toUpperCase();

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    const dt = new Date(newEvent.date);
    dt.setHours(hours, minutes, 0, 0);

    const { data: insertedEvent, error: evErr } = await supabase
      .from('events')
      .insert({
        title: newEvent.title.trim(),
        location: newEvent.location.trim(),
        date: dt.toISOString(),
        promoter_id: promoterId,
        is_public: false,
        qr_code_url: null,
      })
      .select()
      .single();

    if (evErr || !insertedEvent) {
      console.error('Error creating event:', evErr);
      return;
    }

    const artistRows = newEvent.artists
      .filter(a => a.artistName.trim())
      .map(a => ({
        event_id: insertedEvent.id,
        artist_id: a.isRegistered ? a.id : null,
        artist_name_text: !a.isRegistered ? a.artistName.trim() : null,
        performance_time: a.performanceTime.trim() || null,
      }));

    if (artistRows.length > 0) {
      const { error: arErr } = await supabase
        .from('event_artists')
        .insert(artistRows);
      if (arErr) console.error('Error inserting event_artists:', arErr);
    }

    await fetchEvents();
    setShowCreateEvent(false);
    setShowDatePicker(false);
    setNewEvent({
      title: '',
      location: '',
      date: undefined,
      time: '08:00 PM',
      artists: [],
    });
  };

  const handleEditEvent = (ev: UIEvent) => {
    const editingArtists: SelectedArtist[] = ev.artists.map(a => ({
      id: a.artistId || undefined,
      artistName: a.artistName,
      performanceTime: a.performanceTime,
      isRegistered: a.isRegistered,
    }));

    const eventDate = new Date(ev.date);
    let hours = eventDate.getHours();
    const minutes = eventDate.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    
    if (hours > 12) {
      hours -= 12;
    } else if (hours === 0) {
      hours = 12;
    }
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    setEditingTime(timeString);

    const copy: UIEvent = {
      ...ev,
      date: new Date(ev.date),
      artists: ev.artists.map(a => ({ ...a })),
    };
    
    setEditingEventData(copy);
    setEditingArtists(editingArtists);
    
    // Scroll to edit form after state is set
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  const handleSaveEditedEvent = async () => {
    if (!editingEventData || !promoterId) return;

    const timeMatch = editingTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!timeMatch) {
      console.error('Invalid time format');
      return;
    }

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const period = timeMatch[3].toUpperCase();

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    const updatedDate = new Date(editingEventData.date);
    updatedDate.setHours(hours, minutes, 0, 0);

    const { error: updErr } = await supabase
      .from('events')
      .update({
        title: editingEventData.title.trim(),
        location: editingEventData.location.trim(),
        date: updatedDate.toISOString(),
      })
      .eq('id', editingEventData.id);

    if (updErr) {
      console.error('Error updating event:', updErr);
      return;
    }

    const { error: delErr } = await supabase
      .from('event_artists')
      .delete()
      .eq('event_id', editingEventData.id);

    if (delErr) {
      console.error('Error clearing event_artists:', delErr);
      return;
    }

    const newArtistRows = editingArtists
      .filter(a => a.artistName.trim())
      .map(a => ({
        event_id: editingEventData.id,
        artist_id: a.isRegistered ? a.id : null,
        artist_name_text: !a.isRegistered ? a.artistName.trim() : null,
        performance_time: a.performanceTime.trim() || null,
      }));

    if (newArtistRows.length > 0) {
      const { error: addErr } = await supabase
        .from('event_artists')
        .insert(newArtistRows);
      if (addErr) {
        console.error('Error re-inserting event_artists:', addErr);
        return;
      }
    }

    await fetchEvents();
    setEditingEventData(null);
    setEditingArtists([]);
    setEditingTime('08:00 PM');
    setShowEditDatePicker(false);
  };

  const deleteEvent = async (eventId: string) => {
    await supabase.from('event_artists').delete().eq('event_id', eventId);
    await supabase.from('events').delete().eq('id', eventId);
    await fetchEvents();
  };

  const toggleEventPublicAccess = async (eventId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      let qrCodeUrl = null;
      
      if (newStatus) {
        qrCodeUrl = `${window.location.origin}/event/${eventId}`;
      }
      
      const { error } = await supabase
        .from('events')
        .update({ 
          is_public: newStatus,
          qr_code_url: qrCodeUrl 
        })
        .eq('id', eventId);

      if (error) throw error;
      
      await fetchEvents();
    } catch (err: any) {
      console.error('Error updating event public status:', err);
    }
  };

  const handleLogout = async () => {
    try {
      setShowLogoutModal(false);
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      console.log('Link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="w-full flex justify-end">
        <OverlayMenu
          customMenuItems={[]}
          onLogout={() => setShowLogoutModal(true)}
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">Event Management</h2>
        <p className="text-muted-foreground">Manage your events</p>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4">Your Events</h3>
        <button
          onClick={() => setShowCreateEvent(true)}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 mb-6"
        >
          <Plus className="w-5 h-5" />
          <span>Add Event</span>
        </button>
      </div>

      {(showCreateEvent || editingEventData) && (
        <div ref={editFormRef} className="bg-card p-6 rounded-xl shadow-lg border border-border">
          <h4 className="text-lg font-semibold text-foreground mb-4">
            {editingEventData ? `Edit Event: ${editingEventData.title}` : 'Create New Event'}
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Event Title *
              </label>
              <input
                type="text"
                value={editingEventData ? editingEventData.title : newEvent.title}
                onChange={(e) => {
                  if (editingEventData) {
                    setEditingEventData({ ...editingEventData, title: e.target.value });
                  } else {
                    setNewEvent(prev => ({ ...prev, title: e.target.value }));
                  }
                }}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Enter event title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Location *
              </label>
              <input
                type="text"
                value={editingEventData ? editingEventData.location : newEvent.location}
                onChange={(e) => {
                  if (editingEventData) {
                    setEditingEventData({ ...editingEventData, location: e.target.value });
                  } else {
                    setNewEvent(prev => ({ ...prev, location: e.target.value }));
                  }
                }}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Enter venue location"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Date *
                </label>
                <button
                  onClick={() => {
                    if (editingEventData) {
                      setShowEditDatePicker(!showEditDatePicker);
                    } else {
                      setShowDatePicker(!showDatePicker);
                    }
                  }}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground hover:bg-accent transition-colors flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {editingEventData 
                      ? editingEventData.date.toLocaleDateString()
                      : newEvent.date 
                        ? newEvent.date.toLocaleDateString()
                        : 'Select date'
                    }
                  </span>
                </button>

                {((showDatePicker && !editingEventData) || (showEditDatePicker && editingEventData)) && (
                  <div className="absolute z-50 mt-1 bg-card border border-border rounded-lg shadow-lg p-3">
                    <DayPicker
                      mode="single"
                      selected={editingEventData ? editingEventData.date : newEvent.date}
                      onSelect={(date) => {
                        if (date) {
                          if (editingEventData) {
                            setEditingEventData({ ...editingEventData, date });
                            setShowEditDatePicker(false);
                          } else {
                            setNewEvent(prev => ({ ...prev, date }));
                            setShowDatePicker(false);
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <CustomTimePicker
                  label="Time *"
                  value={editingEventData ? editingTime : newEvent.time}
                  onChange={(time) => {
                    if (editingEventData) {
                      setEditingTime(time);
                    } else {
                      setNewEvent(prev => ({ ...prev, time }));
                    }
                  }}
                  placeholder="Select event time"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Artists
              </label>
              <ArtistSearchSelector
                selectedArtists={editingEventData ? editingArtists : newEvent.artists}
                onArtistsChange={(artists) => {
                  if (editingEventData) {
                    setEditingArtists(artists);
                  } else {
                    setNewEvent(prev => ({ ...prev, artists }));
                  }
                }}
                placeholder="Search for registered artists or add custom names..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={editingEventData ? handleSaveEditedEvent : handleCreateEvent}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all"
              >
                {editingEventData ? 'Save Changes' : 'Create Event'}
              </button>
              <button
                onClick={() => {
                  if (editingEventData) {
                    setEditingEventData(null);
                    setEditingArtists([]);
                    setEditingTime('08:00 PM');
                    setShowEditDatePicker(false);
                  } else {
                    setShowCreateEvent(false);
                    setShowDatePicker(false);
                    setNewEvent({
                      title: '',
                      location: '',
                      date: undefined,
                      time: '08:00 PM',
                      artists: [],
                    });
                  }
                }}
                className="flex-1 bg-muted text-muted-foreground py-3 rounded-lg font-semibold hover:bg-accent transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {(showDatePicker || showEditDatePicker) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowDatePicker(false);
            setShowEditDatePicker(false);
          }}
        />
      )}

      <div className="space-y-4">
        {events.map(event => (
          <div key={event.id} className={`bg-card p-6 rounded-xl shadow-sm border transition-all ${
            editingEventData?.id === event.id 
              ? 'border-primary shadow-lg ring-2 ring-primary/20' 
              : 'border-border'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                {/* Public indicator above title */}
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${event.is_public 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                    }
                  `}>
                    {event.is_public ? '🌐 Public' : '🔒 Private'}
                  </span>
                  {editingEventData?.id === event.id && (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                      Currently Editing
                    </span>
                  )}
                </div>
                
                <div className="mb-1">
                  <h4 className="text-lg font-semibold text-foreground">
                    {event.title}
                  </h4>
                </div>
                
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CalendarDays className="w-4 h-4" />
                    <span>{event.date.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Starts at {event.date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <button
                    onClick={() => toggleEventPublicAccess(event.id, event.is_public)}
                    className={`
                      px-3 py-1 rounded-lg text-xs font-medium transition-all
                      ${event.is_public
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                      }
                    `}
                    title={event.is_public ? 'Make Private' : 'Make Public'}
                  >
                    {event.is_public ? 'Make Private' : 'Make Public'}
                  </button>
                  
                  {event.is_public && (
                    <button
                      onClick={() => setShowQRModal(event.id)}
                      className="flex items-center space-x-1 px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors mt-2"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>View event QR code</span>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditEvent(event)}
                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {event.artists.length > 0 && (
              <div className="border-t border-border pt-4">
                <h5 className="text-sm font-medium text-foreground mb-2">Artists:</h5>
                <div className="space-y-2">
                  {event.artists.map(artist => (
                    <div key={artist.id} className="bg-muted/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            artist.isRegistered ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <div className="font-medium text-foreground">
                            {artist.artistName}
                          </div>
                        </div>
                        {artist.performanceTime && (
                          <span className="text-sm text-muted-foreground">
                            {artist.performanceTime}
                          </span>
                        )}
                      </div>
                      <div className="ml-5">
                        <div className="text-xs text-muted-foreground">
                          {artist.isRegistered ? 'Hyve Account' : 'Not a Hyve account'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {events.length === 0 && (
          <div className="text-center py-12">
            <CalendarDays className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No events yet</h3>
            <p className="text-muted-foreground mb-4">Create your first event</p>
            <button
              onClick={() => setShowCreateEvent(true)}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-all"
            >
              Add Event
            </button>
          </div>
        )}
      </div>

      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm">
            <div className="text-center">
              {(() => {
                const event = events.find(e => e.id === showQRModal);
                return (
                  <>
                    <h3 className="text-lg font-bold text-foreground mb-2 capitalize">{event?.title || 'Event QR Code'}</h3>
                    <div className="space-y-1 mb-4">
                      <p className="text-sm text-muted-foreground">{event?.location}</p>
                      <p className="text-sm text-muted-foreground">
                        {event?.date ? new Date(event.date).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: '2-digit'
                        }) : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event?.promoterName ? `Presented by ${event.promoterName.charAt(0).toUpperCase()}${event.promoterName.slice(1)}` : 'Presented by Promoter'}
                      </p>
                    </div>
                  </>
                );
              })()}
              
              {(() => {
                const event = events.find(e => e.id === showQRModal);
                return event?.qr_code_url ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <QRCodeGenerator value={event.qr_code_url} />
                    </div>
                    <div className="text-base text-primary">
                      <p className="font-semibold">Scan to view setlist</p>
                    </div>
                  </div>
                ) : null;
              })()}
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    const event = events.find(e => e.id === showQRModal);
                    if (event?.qr_code_url) {
                      handleCopyLink(event.qr_code_url);
                    }
                  }}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all"
                >
                  Order Posters
                </button>
                <button
                  onClick={() => setShowQRModal(null)}
                  className="flex-1 bg-muted text-muted-foreground py-3 rounded-lg font-semibold hover:bg-accent transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                className="flex-1 bg-muted text-muted-foreground py-3 rounded-lg font-semibold hover:bg-accent transition-all"
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
