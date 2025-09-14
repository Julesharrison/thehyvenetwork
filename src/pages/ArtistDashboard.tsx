import React, { useEffect, useState } from 'react';
import { Link as LinkIcon, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/ui/Modal';
import OverlayMenu from "../components/ui/OverlayMenu";
import { SocialLinks, getSocialLink, updateSocialLink } from '../types';

// Import your brand SVGs
import InstagramLogo from '../assets/brands/instagram.svg';
import TikTokLogo from '../assets/brands/tiktok.svg';
import SnapchatLogo from '../assets/brands/snapchat.svg';
import YoutubeLogo from '../assets/brands/youtube.svg';
import SpotifyLogo from '../assets/brands/spotify.svg';
import CustomUrlLogo from '../assets/brands/customurl.svg';
import UploadImageLogo from '../assets/brands/uploadimage.svg';

export default function ArtistDashboard() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  // UPDATED: Replace blocks state with social links
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [tempUrl, setTempUrl] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [editingStageName, setEditingStageName] = useState<string | null>(null);
  const [stageNameTemp, setStageNameTemp] = useState('');
  const [stageNameError, setStageNameError] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Hex grid layout constants
  const hexRadius = 35;
  const rowPadding = 40;
  const sideColumnOffsetY = 16;
  const centerX = 200;
  const columnSpacing = 80;

  // UPDATED: Simplified data fetching with single query
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        // SINGLE QUERY gets all user data including social links
        const { data: userData, error } = await supabase
          .from('users')
          .select('profile_image_url, social_links')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          return;
        }

        setProfileImageUrl(userData?.profile_image_url || null);
        setSocialLinks(userData?.social_links || {});

      } catch (error) {
        console.error('Supabase fetch failed', error);
      }
    };

    fetchUserData();
  }, [user]);

  // UPDATED: Social link editing handlers
  const handleSocialLinkClick = (platform: string) => {
    setEditingPlatform(platform);
    setTempUrl(getSocialLink(socialLinks, platform as keyof SocialLinks) || '');
  };

  const handleCancelEdit = () => {
    setEditingPlatform(null);
    setTempUrl('');
  };

  const handleSaveSocialLink = async (platform: string) => {
    if (!user) return;

    const updatedLinks = updateSocialLink(socialLinks, platform as keyof SocialLinks, tempUrl);
    
    setSocialLinks(updatedLinks);
    setEditingPlatform(null);
    setTempUrl('');

    // Save to database
    const { error } = await supabase
      .from('users')
      .update({ 
        social_links: updatedLinks,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) console.error('Error saving social link:', error);
  };

  // Profile image upload handler (unchanged)
  const handleUploadProfileImage = async () => {
    if (!profileImageFile || !user) {
      console.log('Missing file or user');
      alert('Please select an image first.');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = profileImageFile.name.split('.').pop()?.toLowerCase();
      const fileName = `${user.id}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('artist-profile-images')
        .upload(fileName, profileImageFile, { 
          upsert: true,
          contentType: profileImageFile.type 
        });

      if (uploadError) {
        console.log('Upload failed:', uploadError);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('artist-profile-images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          profile_image_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Database update failed:', updateError);
        alert(`Database update failed: ${updateError.message}`);
        return;
      }

      setProfileImageUrl(publicUrl);
      setEditingProfile(false);
      setProfileImageFile(null);
      setProfilePreviewUrl(null);

    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred.');
    } finally {
      setIsUploading(false);
    }
  };

  // Stage name editing (unchanged)
  const handleStageNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStageNameTemp(value);
    setStageNameError('');

    if (value && !/^[a-zA-Z0-9_]*$/.test(value)) {
      setStageNameError('Stage name can only contain letters, numbers, and underscores');
    } else if (value.length > 0 && (value.length < 3 || value.length > 30)) {
      setStageNameError('Stage name must be between 3 and 30 characters');
    }
  };

  const handleSaveStageName = async () => {
    if (!user) return;
    
    setStageNameError('');
    
    if (stageNameTemp.length < 3 || stageNameTemp.length > 30) {
      setStageNameError('Stage name must be between 3 and 30 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(stageNameTemp)) {
      setStageNameError('Stage name can only contain letters, numbers, and underscores');
      return;
    }

    try {
      await supabase
        .from('users')
        .update({ 
          stage_name: stageNameTemp,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      const { error: authError } = await supabase.auth.updateUser({
        data: { ...user.user_metadata, stageName: stageNameTemp }
      });
      
      if (authError) console.error('Error updating user metadata:', authError);
      
      setEditingStageName(null);
      setStageNameError('');
    } catch (error) {
      console.error('Failed to update stage name:', error);
      setStageNameError('Failed to update stage name. Please try again.');
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    navigate('/');
  };

  // Helper to get brand logo (unchanged)
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

  const renderPlatformIcon = (platform: string) => {
    const brandLogo = getBrandLogo(platform);
    if (brandLogo) {
      return (
        <image
          href={brandLogo}
          x="14"
          y="10"
          width="60"
          height="60"
        />
      );
    }
    return null;
  };

  if (loading) return <p className="text-white">Loading...</p>;
  if (!user) return <p className="text-white">Please log in</p>;

  const columns = [
    { x: centerX - columnSpacing, labels: ['LEFT TOP', 'LEFT BOTTOM'] },
    { x: centerX, labels: ['TOP', 'CENTER', 'BOTTOM'] },
    { x: centerX + columnSpacing, labels: ['RIGHT TOP', 'RIGHT BOTTOM'] },
  ];

  return (
    <main className="flex flex-col items-center gap-6 bg-black min-h-screen p-6 text-white">
      {/* User Menu */}
      <div className="w-full max-w-[400px] flex justify-end relative">
        <OverlayMenu
          customMenuItems={[{ label: "View unique QR code", action: { type: "navigate", path: "/artist/qr-code" } }]}
          showEditStageName={true}
          onEditStageName={() => { setEditingStageName('editing'); setStageNameTemp(user?.stage_name || ''); }}
          onLogout={() => setShowLogoutModal(true)}
        />
      </div>

      <h1 className="text-3xl font-bold text-center mb-6 tracking-wide">{user?.user_metadata?.stageName || 'Your Hyve'}</h1>

      {/* Hex Grid - UPDATED to use social links */}
      <div className="relative w-[400px] h-[400px]">
        {columns.map((col, colIndex) => {
          const hexHeight = hexRadius * 2;
          const colCount = col.labels.length;
          const colTotalHeight = (hexHeight * 0.75) * (colCount - 1) + hexHeight;
          const centerColumnCount = columns[1].labels.length;
          const centerColumnTotalHeight = (hexHeight * 0.75) * (centerColumnCount - 1) + hexHeight;
          let startY = (centerColumnTotalHeight - colTotalHeight) / 2 + 50;
          if (colIndex !== 1) startY += sideColumnOffsetY;

          return col.labels.map((_, i) => {
            let platform = '';
            if (colIndex === 0) platform = i === 0 ? 'instagram' : 'youtube';
            if (colIndex === 1) platform = i === 0 ? 'tiktok' : i === 1 ? 'profile' : 'spotify';
            if (colIndex === 2) platform = i === 0 ? 'snapchat' : 'custom';

            // UPDATED: Get social link from JSON instead of blocks
            const socialLink = getSocialLink(socialLinks, platform as keyof SocialLinks);
            const isEditing = editingPlatform === platform;
            const hasUrl = socialLink && socialLink.trim() !== '';
            const cy = startY + i * (hexHeight * 0.75 + rowPadding);

            return (
              <div
                key={`${platform}-${i}`}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform transition-opacity duration-300 ${
                  isEditing ? 'scale-110 z-10' : 'hover:scale-105'
                }`}
                style={{
                  left: col.x,
                  top: cy,
                  width: '88px',
                  height: '80px',
                  opacity: hasUrl || platform === 'profile' ? 1 : 0.4,
                }}
                onClick={() => platform === 'profile' ? setEditingProfile(true) : handleSocialLinkClick(platform)}
              >
                <svg viewBox="0 0 88 80" className="w-full h-full shadow-lg">
                  <defs>
                    <clipPath id={`hex-clip-${platform}-${i}`}>
                      <path d="M2.29395 43.1328C1.22115 41.1823 1.22115 38.8177 2.29395 36.8672L20.4434 3.86719C21.5857 1.79031 23.7683 0.500082 26.1387 0.5H61.8613C64.2317 0.500082 66.4143 1.79031 67.5566 3.86719L85.7061 36.8672C86.7788 38.8177 86.7789 41.1823 85.7061 43.1328L67.5566 76.1328C66.4143 78.2097 64.2317 79.4999 61.8613 79.5H26.1387C23.7683 79.4999 21.5857 78.2097 20.4434 76.1328L2.29395 43.1328Z" />
                    </clipPath>
                  </defs>

                  {platform === 'profile' && profileImageUrl ? (
                    <image
                      href={profileImageUrl}
                      width="88"
                      height="80"
                      preserveAspectRatio="xMidYMid slice"
                      clipPath={`url(#hex-clip-${platform}-${i})`}
                      className="rounded-lg"
                    />
                  ) : (
                    renderPlatformIcon(platform)
                  )}

                  <path
                    d="M2.29395 43.1328C1.22115 41.1823 1.22115 38.8177 2.29395 36.8672L20.4434 3.86719C21.5857 1.79031 23.7683 0.500082 26.1387 0.5H61.8613C64.2317 0.500082 66.4143 1.79031 67.5566 3.86719L85.7061 36.8672C86.7788 38.8177 86.7789 41.1823 85.7061 43.1328L67.5566 76.1328C66.4143 78.2097 64.2317 79.4999 61.8613 79.5H26.1387C23.7683 79.4999 21.5857 78.2097 20.4434 76.1328L2.29395 43.1328Z"
                    fill="transparent"
                    stroke={hasUrl || platform === 'profile' ? 'hsl(var(--primary))' : 'gray'}
                    strokeWidth={isEditing ? 3 : 2.5}
                  />
                </svg>
              </div>
            );
          });
        })}
      </div>

      {/* UPDATED: Edit URL Modal for social links */}
      <Modal isOpen={!!editingPlatform} onClose={handleCancelEdit}>
        <h3 className="text-xl font-semibold mb-4 text-center text-foreground">
          Edit {editingPlatform} URL
        </h3>
        <input
          type="url"
          value={tempUrl}
          onChange={e => setTempUrl(e.target.value)}
          placeholder={`Enter ${editingPlatform} URL`}
          className="w-full px-4 py-3 mb-4 bg-black border border-border rounded-lg text-white placeholder-muted-foreground focus:ring-2 focus:ring-primary"
          autoFocus
        />
        <div className="flex space-x-3">
          <button
            onClick={() => handleSaveSocialLink(editingPlatform!)}
            className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all"
          >
            Save
          </button>
          <button
            onClick={handleCancelEdit}
            className="flex-1 border border-border text-muted-foreground py-3 rounded-lg hover:bg-muted transition-all"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Profile Image Modal (unchanged) */}
      <Modal isOpen={editingProfile} onClose={() => {
        setEditingProfile(false);
        setProfileImageFile(null);
        setProfilePreviewUrl(null);
      }}>
        <h3 className="text-xl font-semibold mb-6 text-center text-foreground">Update Profile Image</h3>
        
        <div className="flex flex-col items-center mb-6">
          {profilePreviewUrl ? (
            <div className="relative">
              <img 
                src={profilePreviewUrl} 
                alt="Preview" 
                className="w-32 h-32 object-cover rounded-full border-2 border-primary shadow-lg" 
              />
              <button
                onClick={() => {
                  setProfileImageFile(null);
                  setProfilePreviewUrl(null);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          ) : profileImageUrl ? (
            <img 
              src={profileImageUrl} 
              alt="Current profile" 
              className="w-32 h-32 object-cover rounded-full border-2 border-border opacity-50" 
            />
          ) : (
            <div className="w-32 h-32 bg-muted rounded-full border-2 border-dashed border-border flex items-center justify-center">
              <User className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="block w-full">
            <input 
              type="file" 
              accept="image/png,image/jpeg,image/jpg,image/webp" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    alert('File size must be less than 5MB');
                    return;
                  }
                  setProfileImageFile(file);
                  setProfilePreviewUrl(URL.createObjectURL(file));
                }
              }} 
              className="hidden" 
              disabled={isUploading}
            />
            <div className="w-full bg-muted hover:bg-muted/80 border-2 border-dashed border-border hover:border-primary rounded-lg p-6 text-center cursor-pointer transition-all">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Choose an image</p>
                  <p className="text-xs text-muted-foreground">PNG, JPEG, JPG, WEBP up to 5MB</p>
                </div>
              </div>
            </div>
          </label>
        </div>

        <div className="flex space-x-3">
          <button 
            onClick={handleUploadProfileImage}
            disabled={!profileImageFile || isUploading}
            className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : profileImageFile ? 'Upload Image' : 'Select Image First'}
          </button>
          <button 
            onClick={() => {
              setEditingProfile(false);
              setProfileImageFile(null);
              setProfilePreviewUrl(null);
            }}
            disabled={isUploading}
            className="flex-1 border border-border text-muted-foreground py-3 rounded-lg hover:bg-muted transition-all disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Stage Name Modal (unchanged) */}
      <Modal isOpen={!!editingStageName} onClose={() => {
        setEditingStageName(null);
        setStageNameError('');
      }}>
        <h3 className="text-xl font-semibold mb-4 text-center text-primary">
          Edit Stage Name
        </h3>
        <input
          type="text"
          value={stageNameTemp}
          onChange={handleStageNameChange}
          placeholder={user?.user_metadata?.stageName || "Enter stage name"}
          className="w-full px-4 py-3 mb-2 bg-black border border-primary rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary"
          autoFocus
        />
        {stageNameError && (
          <p className="text-red-500 text-sm mb-4">{stageNameError}</p>
        )}
        <div className="flex space-x-3">
          <button
            onClick={handleSaveStageName}
            disabled={!!stageNameError || !stageNameTemp.trim()}
            className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
          <button
            onClick={() => {
              setEditingStageName(null);
              setStageNameError('');
            }}
            className="flex-1 border border-border text-muted-foreground py-3 rounded-lg hover:bg-muted transition-all"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Logout Modal (unchanged) */}
      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)}>
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
      </Modal>

      {/* Bottom tagline */}
      <div className="w-full flex justify-center mb-12">
        <p className="text-xl font-bold tracking-widest text-primary">BUILD.SHARE.DISCOVER</p>
      </div>
    </main>
  );
}