import React, { useEffect, useState } from 'react';
import { Link as LinkIcon, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/ui/Modal';
import OverlayMenu from "../components/ui/OverlayMenu";
import HexGrid from '../components/HexGrid';
import { SocialLinks, getSocialLink, updateSocialLink } from '../types';


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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteType, setDeleteType] = useState<'link' | 'image' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);


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

  const handleDeleteSocialLink = async (platform: string) => {
    if (!user) return;

    const updatedLinks = updateSocialLink(socialLinks, platform as keyof SocialLinks, '');
    
    setSocialLinks(updatedLinks);
    setEditingPlatform(null);
    setTempUrl('');

    // Update database
    const { error } = await supabase
      .from('users')
      .update({ 
        social_links: updatedLinks,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (error) console.error('Error deleting social link:', error);
  };

  const handleDeleteProfileImage = async () => {
    if (!user) return;

    try {
      // Delete from Supabase Storage if image exists
      if (profileImageUrl) {
        const fileName = `${user.id}.jpg`; // Assuming jpg, but could be dynamic
        
        const { error: deleteError } = await supabase.storage
          .from('artist-profile-images')
          .remove([fileName]);

        if (deleteError) {
          console.error('Error deleting image from storage:', deleteError);
        }
      }

      // Update database to remove profile_image_url
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          profile_image_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        return;
      }

      // Update local state
      setProfileImageUrl(null);
      setEditingProfile(false);
      setProfileImageFile(null);
      setProfilePreviewUrl(null);

    } catch (error) {
      console.error('Error deleting profile image:', error);
    }
  };

  const confirmDeleteLink = (platform: string) => {
    setDeleteType('link');
    setDeleteTarget(platform);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteImage = () => {
    setDeleteType('image');
    setDeleteTarget(null);
    setShowDeleteConfirmation(true);
  };

  const executeDelete = async () => {
    if (deleteType === 'link' && deleteTarget) {
      await handleDeleteSocialLink(deleteTarget);
    } else if (deleteType === 'image') {
      await handleDeleteProfileImage();
    }
    
    setShowDeleteConfirmation(false);
    setDeleteType(null);
    setDeleteTarget(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setDeleteType(null);
    setDeleteTarget(null);
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

  const handleShare = async () => {
    // Generate the artist's profile URL (you may need to adjust this based on your routing)
    const profileUrl = `${window.location.origin}/artist/${user?.user_metadata?.stageName || user?.id}`;
    
    try {
      // Check if Web Share API is available (mobile devices)
      if (navigator.share) {
        await navigator.share({
          title: `${user?.user_metadata?.stageName || 'Artist'} - THE HYVE`,
          text: `Check out ${user?.user_metadata?.stageName || 'this artist'} on THE HYVE!`,
          url: profileUrl
        });
      } else {
        // Fallback to clipboard for desktop
        await navigator.clipboard.writeText(profileUrl);
        // You might want to show a toast notification here
        console.log('Profile URL copied to clipboard:', profileUrl);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: try to copy to clipboard even if share failed
      try {
        await navigator.clipboard.writeText(profileUrl);
        console.log('Profile URL copied to clipboard as fallback:', profileUrl);
      } catch (clipboardError) {
        console.error('Clipboard fallback failed:', clipboardError);
      }
    }
  };


  if (loading) return <p className="text-white">Loading...</p>;
  if (!user) return <p className="text-white">Please log in</p>;


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

      {/* New Hex Grid using SVG components */}
      <HexGrid
        platforms={[
          {
            id: 'instagram',
            platform: 'instagram',
            hasUrl: !!(getSocialLink(socialLinks, 'instagram')?.trim()),
            onClick: () => handleSocialLinkClick('instagram')
          },
          {
            id: 'tiktok',
            platform: 'tiktok',
            hasUrl: !!(getSocialLink(socialLinks, 'tiktok')?.trim()),
            onClick: () => handleSocialLinkClick('tiktok')
          },
          {
            id: 'snapchat',
            platform: 'snapchat',
            hasUrl: !!(getSocialLink(socialLinks, 'snapchat')?.trim()),
            onClick: () => handleSocialLinkClick('snapchat')
          },
          {
            id: 'youtube',
            platform: 'youtube',
            hasUrl: !!(getSocialLink(socialLinks, 'youtube')?.trim()),
            onClick: () => handleSocialLinkClick('youtube')
          },
          {
            id: 'spotify',
            platform: 'spotify',
            hasUrl: !!(getSocialLink(socialLinks, 'spotify')?.trim()),
            onClick: () => handleSocialLinkClick('spotify')
          },
          {
            id: 'custom',
            platform: 'custom',
            hasUrl: !!(getSocialLink(socialLinks, 'custom')?.trim()),
            onClick: () => handleSocialLinkClick('custom')
          },
          {
            id: 'profile',
            platform: 'profile',
            hasUrl: !!profileImageUrl,
            onClick: () => setEditingProfile(true)
          },
          {
            id: 'share',
            platform: 'share',
            hasUrl: true, // Share cell is always active
            onClick: handleShare
          }
        ]}
        profileImageUrl={profileImageUrl}
      />

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
        <div className="space-y-3">
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
          {editingPlatform && getSocialLink(socialLinks, editingPlatform as keyof SocialLinks) && (
            <button
              onClick={() => confirmDeleteLink(editingPlatform)}
              className="w-full bg-destructive text-destructive-foreground py-3 rounded-lg font-semibold hover:bg-destructive/90 transition-all"
            >
              Delete {editingPlatform.charAt(0).toUpperCase() + editingPlatform.slice(1)} Link
            </button>
          )}
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

        <div className="space-y-3">
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
          {profileImageUrl && (
            <button
              onClick={confirmDeleteImage}
              disabled={isUploading}
              className="w-full bg-destructive text-destructive-foreground py-3 rounded-lg font-semibold hover:bg-destructive/90 transition-all disabled:opacity-50"
            >
              Delete Current Image
            </button>
          )}
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirmation} onClose={cancelDelete}>
        <h3 className="text-lg font-medium text-foreground text-center mb-4">
          {deleteType === 'image' 
            ? 'Are you sure you want to delete your profile image?' 
            : `Are you sure you want to delete your ${deleteTarget} link?`
          }
        </h3>
        <p className="text-sm text-muted-foreground text-center mb-6">
          This action cannot be undone.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={executeDelete}
            className="flex-1 bg-destructive text-destructive-foreground py-3 rounded-lg font-semibold hover:bg-destructive/90 transition-all"
          >
            Delete
          </button>
          <button
            onClick={cancelDelete}
            className="flex-1 border border-border text-muted-foreground py-3 rounded-lg hover:bg-muted transition-all"
          >
            Cancel
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