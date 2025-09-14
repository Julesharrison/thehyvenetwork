// ================================================================
// UPDATED TYPES FOR JSON SOCIAL LINKS ARCHITECTURE
// ================================================================

// Social Links interface for JSON storage
export interface SocialLinks {
  instagram?: string | null;
  tiktok?: string | null;
  snapchat?: string | null;
  youtube?: string | null;
  spotify?: string | null;
  custom?: string | null;
  profile?: string | null; // Used for profile image placeholder
}

// Updated User interface with social_links JSON column
export interface User {
  id: string;
  username: string;
  stage_name?: string;
  email: string;
  role: 'artist' | 'supporter' | 'promoter';
  profile_image_url?: string;
  social_links?: SocialLinks;
  created_at?: string;
  updated_at?: string;
}

// Block interface - DEPRECATED (will be removed after migration)
// Keeping temporarily for migration compatibility
export interface Block {
  id: string;
  artistId: string;
  platform: 'instagram' | 'snapchat' | 'tiktok' | 'youtube' | 'spotify' | 'custom' | 'profile';
  url: string;
}

// Scan History interfaces
export interface ScanHistory {
  id: string;
  supporterId: string;
  artistId: string;
  timestamp: Date;
}

export interface LikedArtist {
  id: string;
  supporterId: string;
  artistId: string;
}

// Event-related interfaces
export interface Event {
  id: string;
  title: string;
  location: string;
  date: Date;
  promoterId: string;
  eventSeriesId: string;
}

export interface EventArtist {
  id: string;
  eventId: string;
  artistId: string;
  performanceTime: string;
}

export interface EventSeries {
  id: string;
  name: string;
  description?: string;
  promoterId: string;
}

// Favorites interface (consolidated)
export interface Favourite {
  id: string;
  supporter_id: string;
  artist_id: string;
  created_at: string;
}

// Artist interface for UI components
export interface Artist {
  id: string;
  username: string;
  stageName?: string;
  profile_image_url?: string;
  social_links?: SocialLinks;
  isLiked?: boolean;
}

// Scan History Item for UI
export interface ScanHistoryItem {
  id: string;
  artist: Artist;
  timestamp: Date;
  count?: number; // Number of scans for this artist on this date
}

// Helper type for social platform keys
export type SocialPlatform = keyof SocialLinks;

// Helper type for valid social platforms (excluding profile)
export type ExternalSocialPlatform = Exclude<SocialPlatform, 'profile'>;

// Utility types for social links
export interface SocialLinkData {
  platform: SocialPlatform;
  url: string | null;
  hasUrl: boolean;
}

// Type guards and utilities
export const isSocialPlatform = (platform: string): platform is SocialPlatform => {
  return ['instagram', 'tiktok', 'snapchat', 'youtube', 'spotify', 'custom', 'profile'].includes(platform);
};

export const isExternalSocialPlatform = (platform: string): platform is ExternalSocialPlatform => {
  return isSocialPlatform(platform) && platform !== 'profile';
};

// Helper functions for working with social links
export const getSocialLink = (socialLinks: SocialLinks | undefined, platform: SocialPlatform): string | null => {
  return socialLinks?.[platform] || null;
};

export const hasSocialLink = (socialLinks: SocialLinks | undefined, platform: SocialPlatform): boolean => {
  const link = getSocialLink(socialLinks, platform);
  return link !== null && link.trim() !== '';
};

export const hasAnySocialLinks = (socialLinks: SocialLinks | undefined): boolean => {
  if (!socialLinks) return false;
  return Object.values(socialLinks).some(link => link && link.trim() !== '');
};

export const getActiveSocialPlatforms = (socialLinks: SocialLinks | undefined): SocialPlatform[] => {
  if (!socialLinks) return [];
  return Object.entries(socialLinks)
    .filter(([_, link]) => link && link.trim() !== '')
    .map(([platform, _]) => platform as SocialPlatform);
};

export const getExternalSocialPlatforms = (socialLinks: SocialLinks | undefined): ExternalSocialPlatform[] => {
  return getActiveSocialPlatforms(socialLinks)
    .filter(platform => platform !== 'profile') as ExternalSocialPlatform[];
};

// Create empty social links object with all platforms
export const createEmptySocialLinks = (): SocialLinks => ({
  instagram: null,
  tiktok: null,
  snapchat: null,
  youtube: null,
  spotify: null,
  custom: null,
  profile: null,
});

// Update social links helper
export const updateSocialLink = (
  socialLinks: SocialLinks | undefined, 
  platform: SocialPlatform, 
  url: string | null
): SocialLinks => {
  return {
    ...(socialLinks || {}),
    [platform]: url && url.trim() !== '' ? url.trim() : null,
  };
};

// Format URL helper (ensures proper protocol)
export const formatSocialUrl = (url: string | null): string | null => {
  if (!url || url.trim() === '') return null;
  
  const trimmedUrl = url.trim();
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  return `https://${trimmedUrl}`;
};

// Get display name for platform
export const getPlatformDisplayName = (platform: SocialPlatform): string => {
  switch (platform) {
    case 'instagram': return 'Instagram';
    case 'tiktok': return 'TikTok';
    case 'snapchat': return 'Snapchat';
    case 'youtube': return 'YouTube';
    case 'spotify': return 'Spotify';
    case 'custom': return 'Custom Link';
    case 'profile': return 'Profile';
    default: return platform;
  }
};

// Platform order for consistent UI display
export const SOCIAL_PLATFORM_ORDER: SocialPlatform[] = [
  'instagram',
  'tiktok',
  'snapchat',
  'youtube', 
  'spotify',
  'custom',
  'profile',
];

// Get platforms in consistent order
export const getSocialPlatformsInOrder = (): SocialPlatform[] => {
  return [...SOCIAL_PLATFORM_ORDER];
};

export const getExternalSocialPlatformsInOrder = (): ExternalSocialPlatform[] => {
  return SOCIAL_PLATFORM_ORDER.filter(platform => platform !== 'profile') as ExternalSocialPlatform[];
};