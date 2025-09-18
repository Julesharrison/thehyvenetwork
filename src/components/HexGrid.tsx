import React from 'react';

// Import SVG assets
import instagramActive from '../assets/hexcells/instagram-active.svg';
import instagramInactive from '../assets/hexcells/instagram-inactive.svg';
import profileActive from '../assets/hexcells/profile-active.svg';
import profileInactive from '../assets/hexcells/profile-inactive.svg';
import snapchatActive from '../assets/hexcells/snapchat-active.svg';
import snapchatInactive from '../assets/hexcells/snapchat-inactive.svg';
import spotifyActive from '../assets/hexcells/spotify-active.svg';
import spotifyInactive from '../assets/hexcells/spotify-inactive.svg';
import tiktokActive from '../assets/hexcells/tiktok-active.svg';
import tiktokInactive from '../assets/hexcells/tiktok-inactive.svg';
import websiteActive from '../assets/hexcells/website-active.svg';
import weblinkInactive from '../assets/hexcells/weblink-inactive.svg';
import youtubeActive from '../assets/hexcells/youtube-active.svg';
import youtubeInactive from '../assets/hexcells/youtube-inactive.svg';
import emptyActive from '../assets/hexcells/empty-active.svg';
import emptyInactive from '../assets/hexcells/empty-inactive.svg';
import shareCell from '../assets/hexcells/share-cell.svg';

interface HexCellProps {
  platform: string;
  hasUrl: boolean;
  onClick: () => void;
  position: { x: number; y: number };
  profileImageUrl?: string | null;
}

const HexCell: React.FC<HexCellProps> = ({ platform, hasUrl, onClick, position, profileImageUrl }) => {
  const getSvgPath = (platform: string, hasUrl: boolean) => {
    const state = hasUrl ? 'active' : 'inactive';
    
    switch (platform) {
      case 'instagram': return hasUrl ? instagramActive : instagramInactive;
      case 'profile': return hasUrl ? profileActive : profileInactive;
      case 'snapchat': return hasUrl ? snapchatActive : snapchatInactive;
      case 'spotify': return hasUrl ? spotifyActive : spotifyInactive;
      case 'tiktok': return hasUrl ? tiktokActive : tiktokInactive;
      case 'custom': return hasUrl ? websiteActive : weblinkInactive;
      case 'youtube': return hasUrl ? youtubeActive : youtubeInactive;
      case 'share': return shareCell; // Share cell is always the same
      default: return hasUrl ? emptyActive : emptyInactive;
    }
  };

  // Determine size based on active/inactive state or platform type
  const size = platform === 'share' 
    ? { width: 60, height: 55 } // Smaller size for share cell
    : hasUrl 
      ? { width: 132, height: 126 } 
      : { width: 92, height: 86 };
  const svgPath = getSvgPath(platform, hasUrl);

  // Hexagonal clip path for precise click detection
  const hexClipPath = 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)';

  return (
    <div className="absolute">
      {/* SVG Container - share cell gets click handlers directly */}
      <div
        className={platform === 'share' ? 'cursor-pointer transition-transform duration-200' : ''}
        style={{
          left: `${150 + position.x}px`, // Center point (150px) + offset
          top: `${150 + position.y}px`,  // Center point (150px) + offset
          width: `${size.width}px`,
          height: `${size.height}px`,
          transform: `translate(-50%, -50%)`,
          position: 'absolute',
        }}
        onMouseEnter={platform === 'share' ? (e) => {
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.075)';
        } : undefined}
        onMouseLeave={platform === 'share' ? (e) => {
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
        } : undefined}
        onClick={platform === 'share' ? onClick : undefined}
      >
        {platform === 'profile' && profileImageUrl ? (
          <div className="relative w-full h-full">
            {/* Background hexagon */}
            <img src={svgPath} alt="" className="w-full h-full" />
            {/* Profile image with clip path */}
            <img
              src={profileImageUrl}
              alt="Profile"
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                clipPath: hasUrl 
                  ? 'polygon(37% 15%, 63% 15%, 85% 50%, 63% 85%, 37% 85%, 15% 50%)'
                  : 'polygon(32% 13%, 68% 13%, 87% 50%, 68% 87%, 32% 87%, 13% 50%)'
              }}
            />
          </div>
        ) : (
          <img src={svgPath} alt={`${platform} ${hasUrl ? 'active' : 'inactive'}`} className="w-full h-full" />
        )}
      </div>

      {/* Hexagonal Click Overlay - for all platforms except share */}
      {platform !== 'share' && (
        <div
          className="absolute cursor-pointer transition-transform duration-200"
          style={{
            left: `${150 + position.x}px`,
            top: `${150 + position.y}px`,
            width: `${92 * 0.9 + 4}px`, // Standardized size based on inactive cell dimensions
            height: `${86 * 0.9 + 4}px`,
            transform: `translate(-50%, -50%)`,
            clipPath: hexClipPath,
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            // Scale the SVG container, not the overlay
            const svgContainer = e.currentTarget.previousElementSibling as HTMLElement;
            if (svgContainer) {
              svgContainer.style.transform = 'translate(-50%, -50%) scale(1.075)',
              svgContainer.style.transition = '300ms ease all';
            }
          }}
          onMouseLeave={(e) => {
            // Reset the SVG container scale
            const svgContainer = e.currentTarget.previousElementSibling as HTMLElement;
            if (svgContainer) {
              svgContainer.style.transform = 'translate(-50%, -50%) scale(1)';
            }
          }}
          onClick={onClick}
        />
      )}
    </div>
  );
};

interface HexGridProps {
  platforms: Array<{
    id: string;
    platform: string;
    hasUrl: boolean;
    onClick: () => void;
  }>;
  profileImageUrl?: string | null;
}

const HexGrid: React.FC<HexGridProps> = ({ platforms, profileImageUrl }) => {
  // Hexagonal grid positions calculated from center (0,0)
  // With 8px spacing between cells - matching reference layout
  const positions = [
    // Top row (left to right)
    { id: 'youtube', x: -78, y: -52 },    // Top left
    { id: 'tiktok', x: 0, y: -104 },      // Top center  
    { id: 'share', x: 70, y: -122 },       // Between top center and top right
    { id: 'snapchat', x: 78, y: -52 },    // Top right
    
    // Middle row
    { id: 'instagram', x: -78, y: 52 },   // Middle left
    { id: 'profile', x: 0, y: 0 },        // Center
    { id: 'custom', x: 78, y: 52 },       // Middle right
    
    // Bottom row
    { id: 'spotify', x: 0, y: 104 },      // Bottom center
  ];

  return (
    <div className="relative w-full h-[400px] flex items-center justify-center">
      <div className="relative w-[300px] h-[300px]">
        {positions.map((pos) => {
        const platformData = platforms.find(p => p.id === pos.id);
        if (!platformData) return null;

        return (
          <HexCell
            key={pos.id}
            platform={platformData.platform}
            hasUrl={platformData.hasUrl}
            onClick={platformData.onClick}
            position={pos}
            profileImageUrl={pos.id === 'profile' ? profileImageUrl : undefined}
          />
        );
        })}
      </div>
    </div>
  );
};

export default HexGrid;