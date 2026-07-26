import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Search, UserPlus, Sparkles, Laptop, Smartphone, Bot, Pin } from 'lucide-react';
import UserSearchModal from '../Chat/UserSearchModal';
import RelayAiModal from '../Chat/RelayAiModal';
import GroupsModal from '../Modals/GroupsModal';
import FavouritesModal from '../Modals/FavouritesModal';

export default function Sidebar({ onOpenSettings }) {
  const { profile } = useAuth();
  const { users, activeUser, setActiveUser, onlineUsers, typingUsers, unreadCounts = {}, lastMessages = {}, pinnedUserIds = new Set(), getPrivacyMaskedAvatar, getFriendship } = useChat();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [showFavouritesModal, setShowFavouritesModal] = useState(false);

  // Auto-detect device platform (Desktop vs Mobile)
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  const filteredUsers = users
    .filter((u) => {
      const matchesSearch =
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      const hasUnread = (unreadCounts[u.id] || 0) > 0;
      if (activeFilter === 'Unread') return matchesSearch && hasUnread;
      return matchesSearch;
    })
    .sort((a, b) => {
      const aPinned = pinnedUserIds.has(a.id) || a.is_pinned ? 1 : 0;
      const bPinned = pinnedUserIds.has(b.id) || b.is_pinned ? 1 : 0;
      return bPinned - aPinned;
    });

  const formatTimeAgo = (isoStr) => {
    if (!isoStr) return '';
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (hrs < 48) return 'Yesterday';
    return new Date(isoStr).toLocaleDateString([], { weekday: 'short' });
  };

  return (
    <div className="sidebar-panel">
      {/* Header */}
      <div className="sidebar-header">
        <h1>Chats</h1>
      </div>

      {/* Search Input */}
      <div className="search-container">
        <div className="search-box">
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Ask Relay AI or Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['All', 'Unread', 'Favorites', 'Groups'].map((tab) => {
          const totalUnread = Object.values(unreadCounts).reduce((acc, curr) => acc + (curr || 0), 0);
          const tabLabel = tab === 'Unread' && totalUnread > 0 ? `Unread ${totalUnread}` : tab;
          return (
            <button
              key={tab}
              className={`filter-tab ${activeFilter === tab ? 'active' : ''}`}
              onClick={() => {
                if (tab === 'Groups') {
                  setShowGroupsModal(true);
                } else if (tab === 'Favorites') {
                  setShowFavouritesModal(true);
                } else {
                  setActiveFilter(tab);
                }
              }}
              title={`${tab} Chats`}
            >
              {tabLabel}
            </button>
          );
        })}
      </div>

      {/* Chat List */}
      <div className="chat-list">
        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <div style={{ marginBottom: '12px' }}>
              {activeFilter === 'Unread' ? 'No unread messages' : 'No active chats'}
            </div>
            <button
              onClick={() => setShowSearchModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(0,168,132,0.12)', border: '1px solid rgba(0,168,132,0.3)',
                color: '#00a884', borderRadius: '8px', padding: '7px 14px',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <UserPlus size={15} /> Find Users
            </button>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isSelected = activeUser?.id === u.id;
            const isOnline = onlineUsers.has(u.id) || u.is_online;
            const isTyping = typingUsers[u.id];
            const unreadCount = unreadCounts[u.id] || 0;
            const lastMsg = lastMessages[u.id];
            const lastMsgTime = lastMsg?.created_at || u.last_seen;

            return (
              <div
                key={u.id}
                className={`chat-item ${isSelected ? 'active' : ''}`}
                onClick={() => setActiveUser(u)}
              >
                <div className="chat-avatar" style={{ position: 'relative' }}>
                  <img
                    src={u.isGroup ? u.avatar_url : getPrivacyMaskedAvatar(u)}
                    alt={u.username}
                  />
                  {isOnline ? (
                    <div className="online-dot" title="Online" />
                  ) : (
                    <div
                      style={{
                        position: 'absolute', bottom: '2px', right: '2px',
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: '#667781', border: '2px solid var(--bg-sidebar)'
                      }}
                      title="Offline"
                    />
                  )}
                </div>

                <div className="chat-info">
                  <div className="chat-info-top">
                    <span className="chat-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {u.username}
                      {(pinnedUserIds.has(u.id) || u.is_pinned) && (
                        <Pin size={12} fill="var(--accent-green)" color="var(--accent-green)" style={{ transform: 'rotate(45deg)', flexShrink: 0 }} title="Pinned Chat" />
                      )}
                    </span>
                    <span className="chat-time" style={{ color: unreadCount > 0 ? '#00a884' : undefined, fontWeight: unreadCount > 0 ? 600 : undefined }}>
                      {formatTimeAgo(lastMsgTime)}
                    </span>
                  </div>
                  <div className="chat-info-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="chat-preview" style={{ color: unreadCount > 0 ? 'var(--text-primary)' : undefined, fontWeight: unreadCount > 0 ? 600 : undefined }}>
                      {isTyping ? (
                        <span className="typing-text">typing...</span>
                      ) : lastMsg ? (
                        lastMsg.sender_id === profile?.id ? `You: ${lastMsg.content}` : lastMsg.content
                      ) : (
                        u.isGroup || getFriendship(u.id)?.status === 'accepted' ? (u.status_message || u.email) : 'Profile private'
                      )}
                    </span>

                    {/* Unread Message Green Badge Dot */}
                    {unreadCount > 0 && (
                      <span
                        style={{
                          background: '#00a884',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          borderRadius: '10px',
                          padding: '2px 7px',
                          minWidth: '18px',
                          textAlign: 'center',
                          lineHeight: '1.2',
                          boxShadow: '0 0 8px rgba(0,168,132,0.5)',
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Find Users Search Modal */}
      {showSearchModal && <UserSearchModal onClose={() => setShowSearchModal(false)} />}

      {/* Relay AI Assistant Modal */}
      {showAiModal && <RelayAiModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />}

      {/* Group Creation & Channels Modal */}
      {showGroupsModal && <GroupsModal initialCreate={true} onClose={() => setShowGroupsModal(false)} />}

      {/* Favourites Modal */}
      {showFavouritesModal && <FavouritesModal onClose={() => setShowFavouritesModal(false)} />}
    </div>
  );
}
