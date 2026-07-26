import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PushService } from '../../lib/PushService';
import { X, Moon, Sun, User, Bell, Check, Save, AlertCircle, LogOut, Palette, Upload, Camera, Trash2, AlertTriangle } from 'lucide-react';
import SignOutModal from '../Auth/SignOutModal';
import AvatarCropperModal from './AvatarCropperModal';
import BannerCropperModal from './BannerCropperModal';
import PushPermissionModal from './PushPermissionModal';

const PRESET_AVATARS = [
  'cyberpunk',
  'relay_bot',
  'matrix_hero',
  'quantum_pilot',
  'neon_phoenix',
  'shadow_coder',
];

export default function AppSettingsModal({ onClose, initialTab = 'themes' }) {
  const { profile, updateProfile, updatePassword, deleteAccount, logout } = useAuth();
  const { theme, toggleTheme, accentColor, setAccentColor, customHex, setCustomColor, bgStyle, setBgStyle, orientationLock, setOrientationLock, ACCENT_PRESETS } = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab === 'appearance' ? 'themes' : initialTab);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Profile Edit State
  const [username, setUsername] = useState(profile?.username || '');
  const [statusMessage, setStatusMessage] = useState(profile?.status_message || 'Hey there! I am using Relay.');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [bannerUrl, setBannerUrl] = useState(profile?.banner_url || '');
  const [privacyLastSeen, setPrivacyLastSeen] = useState(profile?.privacy_last_seen || 'friends');
  const [privacyProfilePicture, setPrivacyProfilePicture] = useState(profile?.privacy_profile_picture || 'everyone');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Delete Account State
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Image Upload & Cropper State
  const [uploadImageSrc, setUploadImageSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef(null);

  const [uploadBannerSrc, setUploadBannerSrc] = useState(null);
  const [showBannerCropper, setShowBannerCropper] = useState(false);
  const bannerFileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadImageSrc(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadBannerSrc(reader.result);
        setShowBannerCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedDataUrl) => {
    setAvatarUrl(croppedDataUrl);
    setShowCropper(false);
    setUploadImageSrc(null);
  };

  const handleBannerCropComplete = (croppedDataUrl) => {
    setBannerUrl(croppedDataUrl);
    setShowBannerCropper(false);
    setUploadBannerSrc(null);
  };

  // Notification toggles
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const val = localStorage.getItem('relay_sound_enabled');
    return val !== null ? val === 'true' : true;
  });
  const [readReceipts, setReadReceipts] = useState(() => {
    const val = localStorage.getItem('relay_read_receipts');
    return val !== null ? val === 'true' : true;
  });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushError, setPushError] = useState('');

  useEffect(() => {
    const checkSubscription = async () => {
      const isSubscribed = await PushService.checkIsSubscribed();
      setPushEnabled(isSubscribed);
    };
    checkSubscription();
  }, []);

  const togglePushNotifications = async () => {
    if (!profile) return;
    
    if (pushEnabled) {
      setPushLoading(true);
      setPushError('');
      try {
        await PushService.unsubscribeFromPush(profile.id);
        setPushEnabled(false);
      } catch (err) {
        console.error('Push unsubscribe error:', err);
        setPushError(err.message || 'Failed to unsubscribe');
      } finally {
        setPushLoading(false);
      }
    } else {
      setShowPushModal(true);
    }
  };

  const handleAcceptPush = async () => {
    setShowPushModal(false);
    setPushLoading(true);
    setPushError('');
    try {
      const success = await PushService.subscribeToPush(profile.id);
      setPushEnabled(success);
      if (!success) {
        setPushError('Push notifications are not supported or were blocked.');
      }
    } catch (err) {
      console.error('Push subscribe error:', err);
      setPushError(err.message || 'Failed to enable push notifications');
    } finally {
      setPushLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess(false);

    try {
      await updateProfile({
        username,
        status_message: statusMessage,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        privacy_last_seen: privacyLastSeen,
        privacy_profile_picture: privacyProfilePicture,
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    setPasswordError('');
    setPasswordSuccess(false);

    try {
      await updatePassword(newPassword);
      setPasswordSuccess(true);
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== profile?.username) return;
    setDeletingAccount(true);
    try {
      await deleteAccount();
      onClose();
    } catch (err) {
      console.error('Delete account error:', err);
      setDeletingAccount(false);
    }
  };

  const navTabStyle = (id) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: (activeTab === id || (id === 'themes' && activeTab === 'appearance')) ? 600 : 500,
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    background: (activeTab === id || (id === 'themes' && activeTab === 'appearance')) ? 'var(--bg-active)' : 'transparent',
    color: (activeTab === id || (id === 'themes' && activeTab === 'appearance')) ? 'var(--text-primary)' : 'var(--text-secondary)',
    transition: 'all 0.15s ease',
  });

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-card animate-fade-in-up settings-modal-card" style={{ maxWidth: '680px', padding: '0', overflow: 'hidden', display: 'flex', height: '540px' }}>
        
        {/* Left Settings Sidebar */}
        <div className="settings-sidebar" style={{
          width: '200px',
          background: 'var(--bg-header)',
          borderRight: '1px solid var(--border-color)',
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div className="settings-sidebar-header" style={{ fontSize: '16px', fontWeight: 700, padding: '0 8px 12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            Settings
          </div>

          <button style={navTabStyle('themes')} onClick={() => setActiveTab('themes')}>
            <Palette size={18} />
            <span>Themes</span>
          </button>

          <button style={navTabStyle('profile')} onClick={() => setActiveTab('profile')}>
            <User size={18} />
            <span>Profile</span>
          </button>

          <button style={navTabStyle('notifications')} onClick={() => setActiveTab('notifications')}>
            <Bell size={18} />
            <span>Notifications</span>
          </button>

          <button style={navTabStyle('delete_account')} onClick={() => setActiveTab('delete_account')}>
            <Trash2 size={18} color="#ef4444" />
            <span>Delete Account</span>
          </button>

          {/* User Profile Card */}
          {profile && (
            <div className="settings-sidebar-user" style={{
              marginTop: 'auto',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <img
                src={profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`}
                alt={profile.username}
                style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {profile.username}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {profile.email}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Settings Content */}
        <div className="settings-content" style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', position: 'relative', background: 'var(--bg-sidebar)' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              color: 'var(--icon-default)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              padding: 0,
              zIndex: 20,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-active)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            title="Close Settings"
          >
            <X size={20} style={{ display: 'block', margin: 'auto' }} />
          </button>

          {/* THEMES & ACCENT COLORS TAB */}
          {(activeTab === 'themes' || activeTab === 'appearance') && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>Themes & Accent Colors</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Customize your theme mode and accent color scheme</p>
              </div>

              {/* Theme Mode Toggle Box */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px', background: 'var(--bg-header)', borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {theme === 'dark' ? <Moon size={22} color="var(--accent-green)" /> : <Sun size={22} color="var(--accent-green)" />}
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>Theme Mode</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {theme === 'dark' ? 'Midnight Dark' : 'Cream Light Theme'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={toggleTheme}
                  style={{
                    position: 'relative',
                    width: '52px', height: '28px',
                    borderRadius: '14px',
                    border: 'none',
                    background: theme === 'dark' ? 'var(--accent-green)' : '#d1d7db',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    padding: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '3px',
                    left: theme === 'dark' ? '27px' : '3px',
                    width: '22px', height: '22px',
                    borderRadius: '50%',
                    background: theme === 'dark' ? 'var(--accent-contrast-text, #ffffff)' : '#ffffff',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </button>
              </div>

              {/* Orientation Lock Toggle Box */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px', background: 'var(--bg-header)', borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                      <line x1="12" y1="18" x2="12.01" y2="18"></line>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>Orientation Lock</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {orientationLock ? 'Locked to Portrait Mode' : 'Follows Device Orientation'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setOrientationLock(!orientationLock)}
                  style={{
                    position: 'relative',
                    width: '52px', height: '28px',
                    borderRadius: '14px',
                    border: 'none',
                    background: orientationLock ? 'var(--accent-green)' : '#d1d7db',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    padding: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '3px',
                    left: orientationLock ? '27px' : '3px',
                    width: '22px', height: '22px',
                    borderRadius: '50%',
                    background: orientationLock ? 'var(--accent-contrast-text, #ffffff)' : '#ffffff',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </button>
              </div>

              {/* Accent Color Selection Box */}
              <div style={{
                background: 'var(--bg-header)',
                borderRadius: '12px',
                padding: '18px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                    Accent Color
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Choose your primary highlight color across chats, badges, and controls
                  </div>
                </div>

                {/* Accent Color Swatches Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '4px' }}>
                  {ACCENT_PRESETS.map((preset) => {
                    const isSelected = accentColor === preset.id;
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => setAccentColor(preset.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          background: isSelected ? 'var(--bg-active)' : 'var(--bg-input)',
                          border: isSelected ? '1.5px solid var(--accent-green)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: preset.color,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: '12.5px',
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>


              </div>
              {/* Chat Background Style */}
              <div style={{
                background: 'var(--bg-header)',
                borderRadius: '12px',
                padding: '18px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                    Chat Background
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Choose your preferred message background wallpaper style
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setBgStyle('pattern')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: bgStyle === 'pattern' ? 'var(--bg-active)' : 'var(--bg-input)',
                      border: bgStyle === 'pattern' ? '1.5px solid var(--accent-green)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: bgStyle === 'pattern' ? 600 : 500, color: bgStyle === 'pattern' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      Classic Pattern
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgStyle('solid')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: bgStyle === 'solid' ? 'var(--bg-active)' : 'var(--bg-input)',
                      border: bgStyle === 'solid' ? '1.5px solid var(--accent-green)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: bgStyle === 'solid' ? 600 : 500, color: bgStyle === 'solid' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      Clean Solid
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>Edit Profile</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Changes sync live across all connected users via Supabase</p>
              </div>

              {profileError && (
                <div className="futuristic-alert animate-fade-in-up">
                  <AlertCircle size={15} color="#f87171" />
                  <span>{profileError}</span>
                </div>
              )}

              {profileSuccess && (
                <div style={{ padding: '10px 14px', background: 'rgba(0,168,132,0.12)', border: '1px solid rgba(0,168,132,0.3)', borderRadius: '8px', color: '#00a884', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} /> The Changes are saved successfully.
                </div>
              )}

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Avatar Preview & Selection */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>PROFILE PICTURE</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        position: 'relative',
                        width: '58px',
                        height: '58px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        flexShrink: 0,
                        border: '2px solid var(--accent-green)',
                        boxSizing: 'border-box',
                      }}
                      title="Click to upload custom profile picture"
                    >
                      <img
                        src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username || 'user'}`}
                        alt="Avatar"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '50%',
                          background: 'rgba(0, 0, 0, 0.55)',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#ffffff',
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
                      >
                        <Camera size={22} style={{ display: 'block', margin: 'auto' }} />
                      </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            background: 'var(--bg-active)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <Upload size={14} color="var(--accent-green)" />
                          Upload Custom Photo
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preset Avatars */}
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {PRESET_AVATARS.map((seed) => {
                      const presetUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
                      const isSelected = avatarUrl === presetUrl;
                      return (
                        <button
                          type="button"
                          key={seed}
                          onClick={() => setAvatarUrl(presetUrl)}
                          style={{
                            background: 'none', border: isSelected ? '2px solid var(--accent-green)' : '1px solid var(--border-color)',
                            borderRadius: '50%', padding: '2px', cursor: 'pointer', flexShrink: 0
                          }}
                        >
                          <img src={presetUrl} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Banner Preview & Selection */}
                <div style={{ marginTop: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>CUSTOM BACKGROUND (BANNER)</label>
                  <div 
                    onClick={() => bannerFileInputRef.current?.click()}
                    style={{ 
                      position: 'relative', 
                      width: '100%', 
                      height: '80px', 
                      borderRadius: '12px', 
                      background: bannerUrl ? `url(${bannerUrl}) center/cover no-repeat` : 'linear-gradient(135deg, var(--accent-green) 0%, #0284c7 100%)',
                      cursor: 'pointer',
                      border: '1px solid var(--border-color)',
                      overflow: 'hidden'
                    }}
                    title="Click to upload custom banner"
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
                    >
                      <Camera size={24} />
                      <span style={{ marginLeft: '8px', fontSize: '13px', fontWeight: 600 }}>Change Banner</span>
                    </div>
                  </div>
                  <input
                    ref={bannerFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFileSelect}
                    style={{ display: 'none' }}
                  />
                  {bannerUrl && (
                    <button
                      type="button"
                      onClick={() => setBannerUrl('')}
                      style={{
                        marginTop: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: '#f87171',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Trash2 size={14} /> Remove Banner
                    </button>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>USERNAME</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                {/* Bio / Status Message */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>BIO / STATUS MESSAGE</label>
                  <input
                    type="text"
                    maxLength={140}
                    placeholder="e.g. Building cool things on Relay!"
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                  />
                  <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'right' }}>
                    {statusMessage.length}/140
                  </div>
                </div>

                {/* Privacy Settings */}
                <div style={{ marginTop: '4px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>Privacy</h4>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-primary)' }}>Last Seen</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Who can see when you were last online?</div>
                    </div>
                    <select
                      value={privacyLastSeen}
                      onChange={(e) => setPrivacyLastSeen(e.target.value)}
                      style={{ padding: '6px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="friends">Friends Only</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-primary)' }}>Profile Picture</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Who can see your photo?</div>
                    </div>
                    <select
                      value={privacyProfilePicture}
                      onChange={(e) => setPrivacyProfilePicture(e.target.value)}
                      style={{ padding: '6px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="friends">Friends Only</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="auth-btn" disabled={savingProfile} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px' }}>
                  <Save size={16} />
                  {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>

              {/* Password Change Section */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '12px' }}>Change Password</h4>
                {passwordError && (
                  <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} /> {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div style={{ padding: '8px 12px', background: 'rgba(0, 168, 132, 0.1)', color: 'var(--accent-green)', borderRadius: '6px', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={14} /> Password updated successfully!
                  </div>
                )}
                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="password"
                    placeholder="New password (min. 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                  />
                  <button type="submit" className="auth-btn" disabled={savingPassword || !newPassword} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px', fontSize: '12px', opacity: newPassword ? 1 : 0.6 }}>
                    {savingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

              {/* Account Sign Out Action */}
              <div style={{ marginTop: '8px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f87171' }}>Account Session</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Signed in as {profile?.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSignOutModal(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)',
                    color: '#f87171', borderRadius: '8px', padding: '7px 14px',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>Notifications</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Manage sound and chat alerts</p>
              </div>

              {pushError && (
                <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} flexShrink={0} />
                  <span>{pushError}</span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-header)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600 }}>Push Notifications</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Receive alerts when the app is closed</div>
                </div>
                <button
                  className={`relay-toggle ${pushEnabled ? 'active' : ''}`}
                  aria-checked={pushEnabled}
                  onClick={togglePushNotifications}
                  disabled={pushLoading}
                  style={{ opacity: pushLoading ? 0.5 : 1 }}
                >
                  <div className="relay-toggle-knob" />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-header)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600 }}>Message Sound Alerts</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Play sound when receiving messages</div>
                </div>
                <button
                  className={`relay-toggle ${soundEnabled ? 'active' : ''}`}
                  aria-checked={soundEnabled}
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    localStorage.setItem('relay_sound_enabled', String(!soundEnabled));
                  }}
                >
                  <div className="relay-toggle-knob" />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-header)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600 }}>Read Receipts (✓✓)</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Show when messages are read</div>
                </div>
                <button
                  className={`relay-toggle ${readReceipts ? 'active' : ''}`}
                  aria-checked={readReceipts}
                  onClick={() => {
                    setReadReceipts(!readReceipts);
                    localStorage.setItem('relay_read_receipts', String(!readReceipts));
                  }}
                >
                  <div className="relay-toggle-knob" />
                </button>
              </div>
            </div>
          )}

          {/* DELETE ACCOUNT TAB */}
          {activeTab === 'delete_account' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>
                  Delete Account
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Permanently remove your account and erase all your messages and data from Relay
                </p>
              </div>

              {/* Warning Box */}
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '12px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                }}
              >
                <AlertTriangle size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f87171', marginBottom: '4px' }}>
                    Warning: This action is irreversible
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Once you delete your account, your profile, status message, custom settings, and all direct messages will be permanently deleted and cannot be recovered.
                  </div>
                </div>
              </div>

              {/* Confirmation Action */}
              <div
                style={{
                  marginTop: '6px',
                  padding: '18px',
                  background: 'var(--bg-header)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Confirm Account Deletion
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Type your username <strong style={{ color: '#ef4444' }}>{profile?.username}</strong> to confirm.
                  </div>
                </div>

                <input
                  type="text"
                  placeholder={`Type "${profile?.username || ''}" to confirm`}
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== profile?.username || deletingAccount}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justify: 'center',
                    gap: '8px',
                    padding: '11px 18px',
                    borderRadius: '10px',
                    background: deleteConfirmText === profile?.username ? '#ef4444' : 'rgba(239, 68, 68, 0.35)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: deleteConfirmText === profile?.username ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Trash2 size={16} />
                  {deletingAccount ? 'Deleting Account...' : 'Permanently Delete My Account'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Sub-Modals */}
      {showSignOutModal && (
        <SignOutModal 
          isOpen={showSignOutModal} 
          onClose={() => setShowSignOutModal(false)} 
          onConfirm={logout} 
          profile={profile} 
        />
      )}
      
      {showCropper && (
        <AvatarCropperModal
          isOpen={showCropper}
          imageSrc={uploadImageSrc}
          onClose={() => {
            setShowCropper(false);
            setUploadImageSrc(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}

      {showBannerCropper && (
        <BannerCropperModal
          isOpen={showBannerCropper}
          imageSrc={uploadBannerSrc}
          onClose={() => {
            setShowBannerCropper(false);
            setUploadBannerSrc(null);
          }}
          onCropComplete={handleBannerCropComplete}
        />
      )}

      <PushPermissionModal
        isOpen={showPushModal}
        onClose={() => setShowPushModal(false)}
        onAccept={handleAcceptPush}
      />
    </div>
  );
}
