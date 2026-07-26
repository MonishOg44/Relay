import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Send, Smile, Paperclip, Mic, Search, Phone, FileText, Check, CheckCheck, X, Lock, Star, Trash2, LogOut, Archive, UserX, Unlock, ArrowLeft, Image as ImageIcon, Clock, Download, File } from 'lucide-react';
import { animate } from 'animejs';
import EmojiPicker from './EmojiPicker';
import UserProfileModal from './UserProfileModal';
import GroupInfoModal from './GroupInfoModal';
import ConfirmModal from '../ui/ConfirmModal';
import { useVoiceCall } from '../../context/VoiceCallContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabaseClient';
import MediaViewerModal from './MediaViewerModal';

export default function ChatArea() {
  const { profile } = useAuth();
  const { activeUser, setActiveUser, messages, loadingChat, sendMessage, sendTypingStatus, onlineUsers, typingUsers, deleteChat, deleteGroup, leaveGroup, allUsers = [], users = [], archivedUserIds = new Set(), toggleArchiveUser, blockedUserIds = new Set(), toggleBlockUser, unreadCounts = {}, getPrivacyMaskedAvatar, getPrivacyMaskedLastSeen } = useChat();
  const { startCall } = useVoiceCall();

  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [uploadMode, setUploadMode] = useState('media');

  // Group Info Modal State
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  // Custom Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    type: 'danger',
    onConfirm: () => {},
  });

  const [toastMessage, setToastMessage] = useState('');
  const [viewerData, setViewerData] = useState(null);

  const promptDeleteChat = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Chat History',
      message: `Are you sure you want to delete your chat with "${activeUser?.username}" and clear all message history?`,
      confirmText: 'Delete Chat',
      type: 'danger',
      onConfirm: () => {
        deleteChat(activeUser.id);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const promptLeaveGroup = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Leave Group Channel',
      message: `Are you sure you want to leave "${activeUser?.username}"? You will stop receiving messages from this channel.`,
      confirmText: 'Leave Group',
      type: 'warning',
      onConfirm: () => {
        leaveGroup(activeUser.id);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const promptDeleteGroup = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Group Channel',
      message: `Are you sure you want to permanently delete "${activeUser?.username}" and all its stored channels?`,
      confirmText: 'Delete Channel',
      type: 'danger',
      onConfirm: () => {
        deleteGroup(activeUser.id);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Starred Messages State
  const starStorageKey = profile?.id ? `relay_starred_ids_${profile.id}` : 'relay_starred_ids';
  const favStorageKey = profile?.id ? `relay_favourites_${profile.id}` : 'relay_favourites';

  const [starredMsgIds, setStarredMsgIds] = useState(() => {
    const saved = localStorage.getItem(starStorageKey);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const toggleStarMessage = (msg) => {
    const msgId = msg.id || msg.client_key;
    if (!msgId) return;

    setStarredMsgIds((prev) => {
      const next = new Set(prev);
      const isStarred = next.has(msgId);
      if (isStarred) {
        next.delete(msgId);
      } else {
        next.add(msgId);
      }
      localStorage.setItem(starStorageKey, JSON.stringify(Array.from(next)));

      // Sync with Favourites Modal (Strictly Deduplicated)
      const existingFavs = JSON.parse(localStorage.getItem(favStorageKey) || '[]');
      const cleanExisting = existingFavs.filter((f) => String(f.id) !== String(msgId));

      if (isStarred) {
        localStorage.setItem(favStorageKey, JSON.stringify(cleanExisting));
      } else {
        const newFav = {
          id: String(msgId),
          title: `Starred Message from ${msg.sender_id === profile?.id ? 'You' : activeUser?.username || 'Contact'}`,
          content: msg.content.replace('[FILE]', '').trim(),
          category: msg.content.startsWith('[FILE]') ? 'Files' : msg.content.includes('http') ? 'Links' : 'Messages',
          sender: msg.sender_id === profile?.id ? 'You' : activeUser?.username || 'Contact',
          dateStr: new Date(msg.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
          contactId: activeUser?.id,
        };
        localStorage.setItem(favStorageKey, JSON.stringify([newFav, ...cleanExisting]));
      }

      return next;
    });
  };

  // User Profile Modal State
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Message Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  const messagesEndRef = useRef(null);
  const sendBtnRef = useRef(null);

  const getLastSeenText = (lastSeenIso) => {
    if (!lastSeenIso) return 'offline';
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

  const isOnline = activeUser ? (onlineUsers.has(activeUser.id) || activeUser.is_online) : false;
  const isTyping = activeUser ? typingUsers[activeUser.id] : false;

  // Real-time Group Member Presence & Typing Calculation
  const groupOnlineCount = useMemo(() => {
    if (!activeUser?.isGroup) return 0;
    let count = 1; // Current user is online
    if (activeUser.members && Array.isArray(activeUser.members)) {
      activeUser.members.forEach((mId) => {
        if (onlineUsers.has(mId)) count++;
      });
    } else {
      count = Math.max(1, onlineUsers.size + 1);
    }
    return count;
  }, [activeUser, onlineUsers]);

  const groupTypingText = useMemo(() => {
    if (!activeUser?.isGroup) return null;
    const typers = [];
    const userPool = (allUsers && allUsers.length > 0) ? allUsers : (users || []);

    if (activeUser.members && Array.isArray(activeUser.members)) {
      activeUser.members.forEach((mId) => {
        if (typingUsers[mId]) {
          const userObj = userPool.find((u) => u.id === mId);
          if (userObj) typers.push(userObj.username);
        }
      });
    } else {
      Object.keys(typingUsers || {}).forEach((uId) => {
        if (typingUsers[uId]) {
          const userObj = userPool.find((u) => u.id === uId);
          if (userObj) typers.push(userObj.username);
        }
      });
    }
    if (typers.length === 1) return `${typers[0]} is typing...`;
    if (typers.length > 1) return `${typers.length} members typing...`;
    return null;
  }, [activeUser, typingUsers, allUsers, users]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sanitizeInput = (text) => {
    // Strip malicious HTML script tags / injection vectors
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim().slice(0, 4000);
  };

  const handleInputChange = (e) => {
    const val = e.target.value.slice(0, 4000);
    setInput(val);
    sendTypingStatus(val.trim().length > 0);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const cleanContent = sanitizeInput(input);
    if (!cleanContent) return;

    setInput('');
    sendTypingStatus(false);
    setShowEmoji(false);

    if (sendBtnRef.current) {
      animate(sendBtnRef.current, {
        scale: [0.8, 1.15, 1],
        duration: 350,
        easing: 'easeOutElastic(1, .6)',
      });
    }

    sendMessage(cleanContent).catch((err) => {
      console.error('Failed to send message:', err);
    });
  };

  // Filter messages for search matches
  const matchingMessages = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return messages.filter((m) =>
      m.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  // Highlight search text inside message content
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !activeUser) return;

    const filesToUpload = uploadMode === 'view-once' ? files.slice(0, 1) : files.slice(0, 30);
    setToastMessage(`Uploading ${filesToUpload.length} file(s)...`);
    setShowAttachmentMenu(false);

    try {
      const uploadedMedia = [];
      
      const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      };
      
      for (const file of filesToUpload) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${profile.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat-media')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('chat-media')
          .getPublicUrl(filePath);
          
        uploadedMedia.push({
          url: publicUrl,
          path: filePath,
          type: file.type.startsWith('video/') ? 'video' : (file.type.startsWith('image/') ? 'image' : 'file'),
          name: file.name,
          size: formatBytes(file.size)
        });
      }

      if (uploadedMedia.length > 0) {
        let formattedContent = '';
        if (uploadMode === 'media') {
          formattedContent = `[MEDIA] ${JSON.stringify(uploadedMedia)}`;
        } else if (uploadMode === 'document') {
          formattedContent = `[DOCUMENT] ${JSON.stringify(uploadedMedia)}`;
        } else if (uploadMode === 'view-once') {
          formattedContent = `[VIEW_ONCE] ${JSON.stringify(uploadedMedia[0])}`;
        }
        
        await sendMessage(formattedContent);
        setToastMessage(`Successfully sent ${uploadMode} file(s)`);
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      console.error('File upload error:', err);
      const errMsg = err.message || 'Unknown error';
      setToastMessage(`Upload failed: ${errMsg}. Did you run the SQL script?`);
      setTimeout(() => setToastMessage(''), 5000);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderMessageText = (message) => {
    if (!message || !message.content) return null;
    const content = message.content;

    if (content.startsWith('[MEDIA] ')) {
      try {
        const mediaItems = JSON.parse(content.replace('[MEDIA] ', '').trim());
        const displayItems = mediaItems.slice(0, 4);
        const remainingCount = mediaItems.length - 4;

        // WhatsApp Style Dynamic Grid
        const gridTemplateColumns = mediaItems.length === 1 ? '1fr' : '1fr 1fr';
        
        return (
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns, 
              gap: '4px', 
              borderRadius: '12px',
              overflow: 'hidden',
              maxWidth: '300px'
            }}
          >
            {displayItems.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => setViewerData({ items: mediaItems, initialIndex: idx })}
                style={{ 
                  position: 'relative', 
                  aspectRatio: mediaItems.length === 1 ? 'auto' : '1',
                  cursor: 'pointer',
                  gridColumn: mediaItems.length === 3 && idx === 0 ? '1 / -1' : 'auto',
                  maxHeight: mediaItems.length === 1 ? '300px' : 'auto'
                }}
              >
                {item.type === 'video' ? (
                  <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <img src={item.url} alt="Media" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                )}
                
                {item.type === 'video' && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '12px solid var(--accent-green)', marginLeft: '4px' }} />
                    </div>
                  </div>
                )}

                {/* +N Overlay for the 4th item if there are more */}
                {idx === 3 && remainingCount > 0 && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
                    +{remainingCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      } catch (err) {
        console.error("Failed to parse media", err);
      }
    }

    if (content.startsWith('[DOCUMENT] ')) {
      try {
        const docs = JSON.parse(content.replace('[DOCUMENT] ', '').trim());
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {docs.map((doc, idx) => (
              <a 
                key={idx}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '12px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: 'inherit',
                  width: '280px'
                }}
              >
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                  <File size={24} color="var(--text-primary)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {doc.name}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>
                    Document Attachment • {doc.size}
                  </div>
                </div>
              </a>
            ))}
          </div>
        );
      } catch(err) {
        console.error('Failed to parse document', err);
      }
    }

    if (content.startsWith('[VIEW_ONCE] ')) {
      try {
        const media = JSON.parse(content.replace('[VIEW_ONCE] ', '').trim());
        const isVideo = media.type === 'video';
        const isOwn = message.sender_id === profile.id;
        
        return (
          <div 
            onClick={() => {
              if (isOwn) {
                setToastMessage('You cannot view your own view-once media.');
                setTimeout(() => setToastMessage(''), 3000);
                return;
              }
              setViewerData({
                items: [media],
                initialIndex: 0,
                isViewOnce: true,
                messageId: message.id,
                path: media.path
              });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '6px 12px',
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '20px',
              fontStyle: 'italic'
            }}
          >
            {isVideo ? <Video size={16} /> : <ImageIcon size={16} />}
            <span>{isVideo ? 'Video' : 'Photo'}</span>
            <Clock size={14} style={{ marginLeft: '4px' }} />
          </div>
        );
      } catch (err) {}
    }
    
    if (content === '[VIEW_ONCE_OPENED]') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5, padding: '6px 12px', fontStyle: 'italic' }}>
          <Clock size={16} />
          <span>Opened</span>
        </div>
      );
    }

    if (content.startsWith('[FILE] ')) {
      const fileName = content.replace('[FILE] ', '').trim();
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(0,0,0,0.18)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <FileText size={20} color="var(--accent-green)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '13px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {fileName}
              </div>
              <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                Document Attachment • Auto-deletes in 15d
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (content.startsWith('[SYSTEM] ')) {
      const noticeText = content.replace('[SYSTEM] ', '').trim();
      return (
        <div style={{ textAlign: 'center', padding: '6px 14px', background: 'var(--bg-header)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Users size={13} color="var(--accent-green)" />
          {noticeText}
        </div>
      );
    }

    if (!searchQuery.trim()) return content;

    const query = searchQuery.trim();
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = content.split(new RegExp(`(${escapedQuery})`, 'gi'));

    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          style={{
            background: 'var(--accent-green)',
            color: 'var(--accent-contrast-text)',
            borderRadius: '3px',
            padding: '1px 4px',
            fontWeight: 600,
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const [deviceType, setDeviceType] = useState('Desktop');

  useEffect(() => {
    const ua = (navigator.userAgent || navigator.vendor || window.opera).toLowerCase();
    if (ua.includes('windows')) {
      setDeviceType('Windows');
    } else if (ua.includes('macintosh') || ua.includes('mac os')) {
      setDeviceType('Mac');
    } else if (ua.includes('linux') && !ua.includes('android')) {
      setDeviceType('Linux');
    } else if (ua.includes('android')) {
      setDeviceType('Android');
    } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
      setDeviceType('iOS');
    } else {
      setDeviceType('Web');
    }
  }, []);

  // Empty State (No active user selected)
  if (!activeUser) {
    return (
      <div className="chat-panel">
        <div className="chat-bg-pattern" />
        <div className="empty-state">
          {/* Single Line: Native Relay Script Font + "for [Device]" */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              gap: '10px',
              whiteSpace: 'nowrap',
              marginBottom: '16px',
            }}
          >
            <span
              className="relay-brand-script"
              style={{
                fontSize: '48px',
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              Relay
            </span>
            <span
              style={{
                fontSize: '32px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.6px',
                lineHeight: 1,
              }}
            >
              for {deviceType}
            </span>
          </div>

          <div className="empty-state-content" style={{ marginTop: 0 }}>
            <p>
              Send and receive end-to-end encrypted messages seamlessly. Select a contact from the sidebar to start chatting.
            </p>
          </div>

          <div className="empty-state-footer">
            <Lock size={13} />
            <span>End-to-end encrypted</span>
          </div>
        </div>
      </div>
    );
  }

  const totalOtherUnread = Object.entries(unreadCounts).reduce(
    (acc, [id, count]) => (id !== activeUser?.id ? acc + (count || 0) : acc),
    0
  );

  const handleBackClick = () => {
    setActiveUser(null);
  };

  return (
    <div className="chat-panel">
      <div className="chat-bg-pattern" />

      {/* Chat Header */}
      <div className="chat-header">
        <button
          type="button"
          className="mobile-back-btn"
          onClick={handleBackClick}
          onTouchStart={handleBackClick}
          title="Back to chats"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-green)',
            cursor: 'pointer',
            padding: '8px 10px',
            minWidth: '40px',
            minHeight: '40px',
            marginRight: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontWeight: 600,
            position: 'relative',
            zIndex: 9999,
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={22} color="var(--text-primary)" style={{ pointerEvents: 'none' }} />
          {totalOtherUnread > 0 && (
            <span style={{ fontSize: '13px' }}>
              {totalOtherUnread}
            </span>
          )}
        </button>

        <div
          className="chat-header-left"
          onClick={() => (activeUser?.isGroup ? setShowGroupInfo(true) : setShowUserProfile(true))}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}
          title={activeUser?.isGroup ? 'Click to view group info & members' : 'Click to view profile'}
        >
          <div className="chat-header-avatar">
            <img
              src={activeUser.isGroup ? activeUser.avatar_url : getPrivacyMaskedAvatar(activeUser)}
              alt={activeUser?.username || 'User'}
            />
          </div>
          <div className="chat-header-info">
            <h3>{activeUser?.username}</h3>
            {activeUser?.isGroup ? (
              <div className={`status-text ${groupTypingText ? 'typing' : 'online'}`}>
                {groupTypingText
                  ? groupTypingText
                  : `${activeUser?.membersCount || activeUser?.members?.length || 8} members • ${groupOnlineCount} online`}
              </div>
            ) : (
              <div className={`status-text marquee-mobile ${isTyping ? 'typing' : isOnline ? 'online' : ''}`}>
                {isTyping ? 'typing...' : isOnline ? 'online' : getLastSeenText(getPrivacyMaskedLastSeen(activeUser))}
              </div>
            )}
          </div>
        </div>

        {showSearch ? (
          <div
            className="animate-fade-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              justifyContent: 'flex-end',
              marginLeft: '12px',
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'var(--bg-input)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                padding: '4px 10px',
                width: '100%',
                maxWidth: '280px',
              }}
            >
              <Search size={15} color="var(--text-secondary)" style={{ marginRight: '6px' }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {searchQuery.trim() && (
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {matchingMessages.length} {matchingMessages.length === 1 ? 'match' : 'matches'}
              </span>
            )}

            <button
              type="button"
              className="header-action-btn"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              title="Close search"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="chat-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="header-action-btn"
              title="Search messages"
              onClick={() => {
                setShowSearch(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
            >
              <Search size={18} />
            </button>

            <button
              type="button"
              className="header-action-btn"
              title={archivedUserIds.has(activeUser?.id) ? 'Unarchive Chat' : 'Archive Chat'}
              onClick={() => {
                const isArchived = archivedUserIds.has(activeUser?.id);
                toggleArchiveUser(activeUser.id);
                setToastMessage(isArchived ? 'Chat unarchived' : 'Chat archived');
                setTimeout(() => setToastMessage(''), 3000);
              }}
              style={{ color: archivedUserIds.has(activeUser?.id) ? 'var(--accent-green)' : undefined }}
            >
              <Archive size={18} />
            </button>



            {activeUser?.isGroup ? (
              <>
                <button
                  type="button"
                  className="header-action-btn"
                  title="Leave Group"
                  onClick={promptLeaveGroup}
                  style={{ color: '#f59e0b' }}
                >
                  <LogOut size={18} />
                </button>

                <button
                  type="button"
                  className="header-action-btn"
                  title="Delete Group Channel"
                  onClick={promptDeleteGroup}
                  style={{ color: '#ef4444' }}
                >
                  <Trash2 size={18} />
                </button>
              </>
            ) : (
              <button
                type="button"
                className="header-action-btn"
                title="Delete & Clear Chat"
                onClick={promptDeleteChat}
                style={{ color: '#ef4444' }}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="messages-area">
        {loadingChat ? (
          <div style={{ margin: 'auto', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Loading encrypted messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            No messages yet. Say hello! 👋
          </div>
        ) : (
          messages.map((m) => {
            const isOwn = m.sender_id === profile.id;
            const isMatched = searchQuery.trim() && m.content.toLowerCase().includes(searchQuery.toLowerCase().trim());
            const stableKey = m.client_key || m.id;
            const isStarred = starredMsgIds.has(m.id || m.client_key);

            return (
              <div key={stableKey} className={`msg-row ${isOwn ? 'out' : 'in'}`}>
                <div
                  className="msg-bubble"
                  style={
                    isMatched
                      ? { boxShadow: '0 0 0 2px var(--accent-green)', transition: 'box-shadow 0.2s ease' }
                      : {}
                  }
                >
                  <button
                    type="button"
                    className={`msg-star-btn ${isStarred ? 'is-starred' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStarMessage(m);
                    }}
                    title={isStarred ? 'Unstar message' : 'Star message'}
                  >
                    <Star size={12} fill={isStarred ? '#eab308' : 'none'} color={isStarred ? '#eab308' : 'var(--text-secondary)'} />
                  </button>

                  <div className="msg-text">{renderMessageText(m)}</div>
                  <div className="msg-footer">
                    {isStarred && (
                      <Star size={11} fill="#eab308" color="#eab308" title="Starred message" style={{ marginRight: '2px' }} />
                    )}
                    <span className="msg-time">{formatTime(m.created_at)}</span>
                    {isOwn && (
                      m.is_read
                        ? <CheckCheck size={16} color="#53bdeb" />
                        : <Check size={16} style={{ opacity: 0.6 }} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="msg-row in animate-fade-in">
            <div className="msg-bubble" style={{ display: 'flex', gap: '4px', padding: '10px 14px' }}>
              <span style={{ animation: 'bounceDot 1s infinite 0s', color: 'var(--text-secondary)' }}>•</span>
              <span style={{ animation: 'bounceDot 1s infinite 0.15s', color: 'var(--text-secondary)' }}>•</span>
              <span style={{ animation: 'bounceDot 1s infinite 0.3s', color: 'var(--text-secondary)' }}>•</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">

        {blockedUserIds.has(activeUser?.id) ? (
          <div style={{ flex: 1, textAlign: 'center', color: '#ef4444', fontSize: '12px', fontWeight: 700, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>This user is currently blocked.</span>
            <button
              onClick={() => toggleBlockUser(activeUser.id)}
              style={{ background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
            >
              Unblock Contact
            </button>
          </div>
        ) : (
          <>
            {showEmoji && (
              <div style={{ position: 'absolute', bottom: '70px', left: '16px', zIndex: 100 }}>
                <EmojiPicker
                  onSelect={(emoji) => setInput((prev) => prev + emoji)}
                  onClose={() => setShowEmoji(false)}
                />
              </div>
            )}

            <button className="input-icon-btn" onClick={() => setShowEmoji(!showEmoji)} title="Emoji picker (Or press Win + . / Cmd + Ctrl + Space)">
              <Smile size={24} />
            </button>
            <div style={{ position: 'relative' }}>
              {showAttachmentMenu && (
                <div 
                  className="animate-fade-in-up"
                  style={{ 
                    position: 'absolute', 
                    bottom: '40px', 
                    left: '0',
                    background: 'var(--bg-header)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    zIndex: 100,
                    minWidth: '220px',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)'
                  }}
                >
                  <button 
                    type="button"
                    onClick={() => { setUploadMode('media'); setTimeout(() => fileInputRef.current?.click(), 0); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '8px', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={20} color="#3b82f6" />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Photos & Videos</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setUploadMode('document'); setTimeout(() => fileInputRef.current?.click(), 0); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '8px', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <File size={20} color="#8b5cf6" />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Document</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setUploadMode('view-once'); setTimeout(() => fileInputRef.current?.click(), 0); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '8px', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={20} color="#10b981" />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>View Once</span>
                  </button>
                </div>
              )}
              <button className="input-icon-btn" type="button" onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} title="Attach Document / File">
                <Paperclip size={24} />
              </button>
            </div>
            
            {/* Click outside to close attachment menu */}
            {showAttachmentMenu && (
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 99 }} 
                onClick={() => setShowAttachmentMenu(false)}
              />
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple={uploadMode !== 'view-once'}
              accept={uploadMode === 'document' ? "*/*" : "image/*,video/*"}
              style={{ display: 'none' }}
            />

            <form onSubmit={handleSend} className="chat-input-box">
              <input
                type="text"
                placeholder="Type a message"
                value={input}
                onChange={handleInputChange}
                maxLength={4000}
                autoComplete="off"
                inputMode="text"
              />
            </form>

            {input.trim() ? (
              <button ref={sendBtnRef} className="send-btn" onClick={handleSend}>
                <Send size={22} />
              </button>
            ) : (
              <button className="send-btn">
                <Mic size={22} />
              </button>
            )}
          </>
        )}
      </div>

      {/* User Profile View Modal */}
      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        user={activeUser}
        isOnline={isOnline}
      />

      {/* Group Info & Members List Modal */}
      <GroupInfoModal
        isOpen={showGroupInfo}
        onClose={() => setShowGroupInfo(false)}
        group={activeUser}
        onLeaveGroup={promptLeaveGroup}
        onDeleteGroup={promptDeleteGroup}
      />

      {/* Custom Theme-Adaptive Confirm Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 'max(90px, calc(env(safe-area-inset-bottom) + 90px))',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 999999,
          padding: '0 16px'
        }}>
          <div style={{
            background: 'rgba(28, 28, 30, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '30px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            maxWidth: '100%',
            textAlign: 'center',
            lineHeight: '1.4',
            animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            pointerEvents: 'auto'
          }}>
            <Archive size={16} color="var(--accent-green)" style={{ flexShrink: 0 }} />
            <span style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>{toastMessage}</span>
          </div>
        </div>
      )}

      {viewerData && (
        <MediaViewerModal
          items={viewerData.items}
          initialIndex={viewerData.initialIndex}
          onClose={async () => {
            if (viewerData.isViewOnce) {
              const { messageId, path } = viewerData;
              setViewerData(null);
              setToastMessage('Deleting view-once media...');
              
              try {
                if (path) {
                  await supabase.storage.from('chat-media').remove([path]);
                }
                if (messageId) {
                  await supabase
                    .from('messages')
                    .update({ content: '[VIEW_ONCE_OPENED]' })
                    .eq('id', messageId);
                }
                setToastMessage('View-once media deleted securely.');
              } catch (err) {
                console.error('Failed to delete view once media', err);
                setToastMessage('Failed to delete media.');
              } finally {
                setTimeout(() => setToastMessage(''), 3000);
              }
            } else {
              setViewerData(null);
            }
          }}
        />
      )}
    </div>
  );
}
