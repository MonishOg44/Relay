import React from 'react';
import { X, AtSign, ShieldCheck, Phone, Video, MessageSquare, Calendar, UserCheck, UserPlus, HardDrive, UserX, Clock, UserMinus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useVoiceCall } from '../../context/VoiceCallContext';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import ConfirmModal from '../ui/ConfirmModal';
import SharedItemsModal from './SharedItemsModal';
import { supabase } from '../../lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';

export default function UserProfileModal({ isOpen, onClose, user, isOnline }) {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { startCall } = useVoiceCall();
  const { blockedUserIds, toggleBlockUser, getFriendship, getPrivacyMaskedAvatar, getPrivacyMaskedLastSeen } = useChat();
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });
  const [showSharedItems, setShowSharedItems] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  if (!isOpen || !user) return null;

  const isDark = theme === 'dark';
  const friendship = getFriendship(user.id);

  const handleFriendAction = async () => {
    if (loadingAction || !profile || !supabase) return;
    setLoadingAction(true);
    
    try {
      if (!friendship) {
        // Send request
        await supabase.from('friendships').insert({
          requester_id: profile.id,
          receiver_id: user.id,
          status: 'pending'
        });
      } else if (friendship.status === 'pending') {
        if (friendship.requester_id === profile.id) {
          // Cancel sent request
          await supabase.from('friendships').delete().eq('id', friendship.id);
        } else {
          // Accept received request
          await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendship.id);
        }
      } else if (friendship.status === 'accepted') {
        // Remove friend
        await supabase.from('friendships').delete().eq('id', friendship.id);
      }
    } catch (err) {
      console.error('Friend action failed', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const getFriendButtonState = () => {
    if (loadingAction) return { text: 'Wait...', icon: Clock, bg: 'var(--bg-input)', color: 'var(--text-secondary)' };
    if (!friendship) return { text: 'Add Friend', icon: UserPlus, bg: 'transparent', color: 'var(--accent-green)', action: 'Add' };
    
    if (friendship.status === 'pending') {
      if (friendship.requester_id === profile.id) {
        return { text: 'Requested (Cancel)', icon: Clock, bg: 'var(--bg-input)', color: 'var(--text-secondary)', action: 'Cancel' };
      }
      return { text: 'Accept Request', icon: UserCheck, bg: 'var(--accent-green)', color: '#fff', action: 'Accept' };
    }
    
    // Accepted
    const duration = formatDistanceToNow(new Date(friendship.created_at));
    return { text: `Friends for ${duration}`, icon: UserCheck, bg: 'rgba(0, 168, 132, 0.15)', color: 'var(--accent-green)', action: 'Remove' };
  };

  const btnState = getFriendButtonState();


  const getLastSeenText = (lastSeenIso) => {
    if (!lastSeenIso) return 'Offline';
    const date = new Date(lastSeenIso);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Last seen just now';
    if (diffMins < 60) return `Last seen ${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Last seen ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const isYesterday = new Date(Date.now() - 86400000).toDateString() === date.toDateString();
    if (isYesterday) {
      return `Last seen yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return `Last seen on ${date.toLocaleDateString([], { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })}`;
  };

  return (
    <div className="modal-overlay profile-modal-overlay animate-fade-in" style={{ zIndex: 1000 }} onClick={onClose}>
      <div
        className="modal-card profile-modal-card animate-fade-in-up"
        style={{
          maxWidth: '400px',
          padding: '0',
          overflow: 'hidden',
          borderRadius: '16px',
          background: isDark ? 'var(--bg-header)' : '#ffffff',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner Background */}
        <div
          style={{
            height: '110px',
            background: user.banner_url ? `url(${user.banner_url}) center/cover no-repeat` : 'linear-gradient(135deg, var(--accent-green) 0%, #0284c7 100%)',
            position: 'relative',
            padding: '16px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.35)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              padding: 0,
              backdropFilter: 'blur(4px)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.35)'; }}
            title="Close"
          >
            <X size={18} style={{ display: 'block', margin: 'auto' }} />
          </button>
        </div>

        {/* Profile Card Body */}
        <div style={{ padding: '0 24px 24px', marginTop: '-48px', position: 'relative' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {/* Avatar with Status Badge */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '14px' }}>
              <img
                src={getPrivacyMaskedAvatar(user)}
                alt={user.username}
                style={{
                  width: '88px',
                  height: '88px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `4px solid ${isDark ? 'var(--bg-header)' : '#ffffff'}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  background: 'var(--bg-input)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '6px',
                  right: '6px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: isOnline ? '#10b981' : '#94a3b8',
                  border: `2.5px solid ${isDark ? 'var(--bg-header)' : '#ffffff'}`,
                }}
              />
            </div>

            {/* User Names & Handle */}
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
              {user.username}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: isOnline ? '#10b981' : '#94a3b8',
                }}
              />
              <span style={{ fontSize: '12.5px', color: isOnline ? '#10b981' : 'var(--text-secondary)', fontWeight: 500 }}>
                {isOnline ? 'Online now' : getPrivacyMaskedLastSeen(user) ? getLastSeenText(getPrivacyMaskedLastSeen(user)) : 'Offline'}
              </span>
            </div>
          </div>
          </div>

          {/* Quick Communication Buttons */}
          {user.id !== profile?.id && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => { startCall(user, 'audio'); onClose(); }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)',
                  padding: '12px 20px', borderRadius: '16px', color: 'var(--accent-green)', cursor: 'pointer',
                  minWidth: '70px', transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-sidebar)'}
              >
                <Phone size={20} />
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Audio</span>
              </button>
              <button
                type="button"
                onClick={() => { startCall(user, 'video'); onClose(); }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                  background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)',
                  padding: '12px 20px', borderRadius: '16px', color: 'var(--accent-green)', cursor: 'pointer',
                  minWidth: '70px', transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-sidebar)'}
              >
                <Video size={20} />
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Video</span>
              </button>
            </div>
          )}

          {/* Bio / Status Quote */}
          {user.status_message && friendship?.status === 'accepted' && (
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--bg-sidebar)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                About / Bio
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                {user.status_message}
              </div>
            </div>
          )}

          {/* Information Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                background: 'var(--bg-sidebar)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
              }}
            >
              <AtSign size={16} color="var(--accent-green)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Relay Handle</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  @{user.username?.toLowerCase().replace(/\s+/g, '_')}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                background: 'var(--bg-sidebar)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
              }}
            >
              <ShieldCheck size={16} color="#00a884" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Encryption & Security</div>
                <div style={{ fontSize: '12.5px', color: '#00a884', fontWeight: 600 }}>
                  End-to-End Encrypted Session
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                const isCurrentlyBlocked = blockedUserIds?.has(user.id);
                setConfirmConfig({
                  isOpen: true,
                  title: isCurrentlyBlocked ? 'Unblock User' : 'Block User',
                  message: isCurrentlyBlocked 
                    ? `Are you sure you want to unblock ${user.username}? They will be able to message and call you again.`
                    : `Are you sure you want to block ${user.username}? They will no longer be able to message or call you.`,
                  confirmText: isCurrentlyBlocked ? 'Unblock' : 'Block',
                  type: isCurrentlyBlocked ? 'info' : 'danger',
                  onConfirm: () => {
                    if (toggleBlockUser) toggleBlockUser(user.id);
                    setConfirmConfig({ isOpen: false });
                  },
                });
              }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '11px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
              }}
            >
              <UserX size={16} />
              {blockedUserIds?.has(user?.id) ? 'Unblock User' : 'Block User'}
            </button>
            <button
              type="button"
              onClick={() => setShowSharedItems(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                padding: '11px 16px',
                borderRadius: '10px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
              title="Shared Items"
            >
              <HardDrive size={16} color="var(--accent-green)" />
            </button>
          </div>

          {/* Add Friend Button */}
          {user.id !== profile?.id && (
            <button
              type="button"
              onClick={() => {
                if (btnState.action === 'Remove') {
                  setConfirmConfig({
                    isOpen: true,
                    title: 'Remove Friend',
                    message: `Are you sure you want to remove ${user.username} from your friends?`,
                    confirmText: 'Remove',
                    type: 'danger',
                    onConfirm: () => {
                      handleFriendAction();
                      setConfirmConfig({ isOpen: false });
                    }
                  });
                } else {
                  handleFriendAction();
                }
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '11px',
                marginTop: '10px',
                borderRadius: '10px',
                background: btnState.bg,
                border: `1px solid ${btnState.action === 'Add' ? 'var(--accent-green)' : 'transparent'}`,
                color: btnState.color,
                fontSize: '13px',
                fontWeight: 600,
                cursor: loadingAction ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <btnState.icon size={16} />
              {btnState.text}
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig({ isOpen: false })}
      />

      <SharedItemsModal
        isOpen={showSharedItems}
        onClose={() => setShowSharedItems(false)}
        user={user}
      />
    </div>
  );
}
