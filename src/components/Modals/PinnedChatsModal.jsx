import React, { useState } from 'react';
import { Pin, X, Search } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export default function PinnedChatsModal({ onClose }) {
  const { users, setActiveUser, pinnedUserIds = new Set(), togglePinUser } = useChat();
  const [searchTerm, setSearchTerm] = useState('');

  const displayUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (user) => {
    setActiveUser(user);
    onClose();
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 3500 }}>
      <div className="modal-card animate-fade-in-up" style={{ maxWidth: '520px', width: '90%' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--icon-default)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0, 168, 132, 0.14)', color: 'var(--accent-green)' }}>
            <Pin size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Pinned Conversations
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Pin critical contacts to keep them at the top of your sidebar
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search contacts to pin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-header)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '9px 12px 9px 36px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
          {displayUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              No contacts found matching your search.
            </div>
          ) : (
            displayUsers.map((user) => {
              const isPinned = pinnedUserIds.has(user.id) || user.is_pinned;
              return (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--bg-header)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => handleSelectUser(user)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                      alt={user.username}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.username}</span>
                        {isPinned && (
                          <Pin size={12} fill="var(--accent-green)" color="var(--accent-green)" style={{ transform: 'rotate(45deg)', flexShrink: 0 }} />
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.status_message || user.email}
                      </div>
                    </div>
                  </div>

                  <button
                    className="pin-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePinUser(user.id);
                    }}
                    title={isPinned ? 'Unpin chat' : 'Pin chat'}
                    style={{
                      background: isPinned ? 'rgba(0,168,132,0.15)' : 'transparent',
                      borderColor: isPinned ? 'var(--accent-green)' : 'var(--border-color)',
                      color: isPinned ? 'var(--accent-green)' : 'var(--text-secondary)',
                    }}
                  >
                    <Pin size={14} style={{ transform: isPinned ? 'rotate(45deg)' : 'none' }} />
                    {isPinned ? 'Pinned' : 'Pin'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
