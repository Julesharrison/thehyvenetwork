import React, { useState, useEffect } from 'react';
import { Search, User, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Artist } from '../types';
import CustomTimePicker from './CustomTimePicker';

interface SelectedArtist {
  id?: string; // UUID if registered artist
  artistName: string; // Display name
  performanceTime: string;
  isRegistered: boolean; // true if selected from DB, false if custom text
}

interface ArtistSearchSelectorProps {
  selectedArtists: SelectedArtist[];
  onArtistsChange: (artists: SelectedArtist[]) => void;
  placeholder?: string;
}

export default function ArtistSearchSelector({ 
  selectedArtists, 
  onArtistsChange, 
  placeholder = "Search for artists or add custom name..."
}: ArtistSearchSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [availableArtists, setAvailableArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch artists from database
  const fetchArtists = async () => {
    try {
      setLoading(true);
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, stage_name, profile_image_url')
        .eq('role', 'artist');

      if (usersError) throw usersError;

      const artistsData = usersData.map(artist => ({
        id: artist.id,
        username: artist.username,
        stageName: artist.stage_name,
        profile_image_url: artist.profile_image_url,
      }));

      setAvailableArtists(artistsData);
    } catch (err: any) {
      console.error('Error fetching artists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  // Filter artists based on search query
  const filteredArtists = availableArtists.filter(artist => {
    const query = searchQuery.toLowerCase();
    return (
      artist.username.toLowerCase().includes(query) ||
      artist.stageName?.toLowerCase().includes(query)
    );
  });

  // Add selected registered artist
  const handleArtistSelect = (artist: Artist) => {
    const isAlreadySelected = selectedArtists.some(selected => 
      selected.id === artist.id && selected.isRegistered
    );
    
    if (!isAlreadySelected) {
      const newArtist: SelectedArtist = {
        id: artist.id,
        artistName: artist.stageName || artist.username,
        performanceTime: '',
        isRegistered: true
      };
      
      onArtistsChange([newArtist, ...selectedArtists]);
    }
    
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Add custom artist name (not in database) - FIXED FUNCTION
  const handleAddCustomArtist = () => {
    const artistName = searchQuery.trim();
    if (artistName) {
      // Check if already added to avoid duplicates
      const isAlreadySelected = selectedArtists.some(selected => 
        selected.artistName.toLowerCase() === artistName.toLowerCase()
      );
      
      if (!isAlreadySelected) {
        const newArtist: SelectedArtist = {
          artistName: artistName,
          performanceTime: '',
          isRegistered: false
        };
        
        onArtistsChange([newArtist, ...selectedArtists]);
      }
      
      setSearchQuery('');
      setShowDropdown(false);
    }
  };

  // Remove artist from selection
  const handleRemoveArtist = (index: number) => {
    const updatedArtists = selectedArtists.filter((_, i) => i !== index);
    onArtistsChange(updatedArtists);
  };

  // Update performance time for specific artist
  const handlePerformanceTimeChange = (index: number, time: string) => {
    const updatedArtists = selectedArtists.map((artist, i) => 
      i === index ? { ...artist, performanceTime: time } : artist
    );
    onArtistsChange(updatedArtists);
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowDropdown(value.length > 0);
  };

  // Check if we should show the add custom option
  const shouldShowAddCustom = searchQuery.trim() && 
    !filteredArtists.some(artist => 
      (artist.stageName || artist.username).toLowerCase() === searchQuery.toLowerCase()
    );

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchQuery.length > 0 && setShowDropdown(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary transition-all"
          />
        </div>

        {/* Dropdown with search results */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm">Loading artists...</p>
              </div>
            ) : (
              <>
                {/* Registered Artists */}
                {filteredArtists.length > 0 && (
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 px-2">
                      Registered Artists
                    </p>
                    {filteredArtists.map((artist) => (
                      <button
                        key={artist.id}
                        type="button"
                        onClick={() => handleArtistSelect(artist)}
                        className="w-full flex items-center space-x-3 p-2 hover:bg-accent rounded-lg transition-colors text-left"
                      >
                        {artist.profile_image_url ? (
                          <div className="relative w-10 h-10">
                            <svg viewBox="0 0 48 48" className="w-full h-full">
                              <defs>
                                <clipPath id={`hex-clip-${artist.id}`}>
                                  <path d="M1.24 23.46C0.67 22.43 0.67 21.17 1.24 20.14L10.46 3.95C11.08 2.79 12.39 2.09 13.8 2.09H32.2C33.61 2.09 34.92 2.79 35.54 3.95L44.76 20.14C45.33 21.17 45.33 22.43 44.76 23.46L35.54 39.65C34.92 40.81 33.61 41.51 32.2 41.51H13.8C12.39 41.51 11.08 40.81 10.46 39.65L1.24 23.46Z" />
                                </clipPath>
                              </defs>
                              <image
                                href={artist.profile_image_url}
                                width="48"
                                height="48"
                                preserveAspectRatio="xMidYMid slice"
                                clipPath={`url(#hex-clip-${artist.id})`}
                              />
                              <path
                                d="M1.24 23.46C0.67 22.43 0.67 21.17 1.24 20.14L10.46 3.95C11.08 2.79 12.39 2.09 13.8 2.09H32.2C33.61 2.09 34.92 2.79 35.54 3.95L44.76 20.14C45.33 21.17 45.33 22.43 44.76 23.46L35.54 39.65C34.92 40.81 33.61 41.51 32.2 41.51H13.8C12.39 41.51 11.08 40.81 10.46 39.65L1.24 23.46Z"
                                fill="transparent"
                                stroke="hsl(var(--primary))"
                                strokeWidth="1"
                              />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">
                            {artist.stageName || artist.username}
                          </p>
                          <p className="text-sm text-muted-foreground">@{artist.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Add Custom Artist Option - COMPLETELY REWRITTEN */}
                {shouldShowAddCustom && (
                  <div className="border-t border-border">
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                        Add Custom Artist
                      </p>
                      <button
                        type="button"
                        onClick={handleAddCustomArtist}
                        className="w-full flex items-center justify-center space-x-2 p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                      >
                        <span>Add "{searchQuery.trim()}"</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* No results */}
                {filteredArtists.length === 0 && !shouldShowAddCustom && searchQuery.trim() && (
                  <div className="p-4 text-center text-muted-foreground">
                    <p className="text-sm">No artists found</p>
                  </div>
                )}

                {!searchQuery.trim() && (
                  <div className="p-4 text-center text-muted-foreground">
                    <p className="text-sm">Start typing to search for artists</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Selected Artists List */}
      {selectedArtists.length > 0 && (
        <div className="space-y-3">
          <p className="font-medium text-foreground">Selected Artists</p>
          {selectedArtists.map((artist, index) => (
            <div
              key={`${artist.id || artist.artistName}-${index}`}
              className="bg-card p-4 border border-border rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {artist.isRegistered ? (
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    </div>
                  )}
                  <span className="font-medium text-foreground">{artist.artistName}</span>
                  <span className="text-xs text-muted-foreground">
                    {artist.isRegistered ? '(Hyve Account)' : '(Not A Hyve Account)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveArtist(index)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div>
                <CustomTimePicker
                  label="Performance Time (optional)"
                  value={artist.performanceTime}
                  onChange={(time) => handlePerformanceTimeChange(index, time)}
                  placeholder="Select performance time"
                  className="w-full"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}