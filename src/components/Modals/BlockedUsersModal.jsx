import React, { useState } from 'react';
import { UserX, X, Unlock, UserPlus, Search, ShieldAlert, Check } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export default function BlockedUsersModal({ onClose }) {
  const { allUsers = [], users = [], blockedUserIds = new Set(), toggleBlockUser } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [showBlockSelect, setShowBlockSelect] = useState(false);

  const availableUsers = (allUsers && allUsers.length > 0) ? allUsers : users;

  const blockedList = React.useMemo(() => {
    return availableUsers.filter((u) => blockedUserIds.has(u.id));
  }, [availableUsers, blockedUserIds]);

  const unblockedList = React.useMemo(() => {
    return availableUsers.filter((u) => !blockedUserIds.has(u.id) && !u.isGroup);
  }, [availableUsers, blockedUserIds]);

  const filteredBlocked = blockedList.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleUnblock = (userId) => {
    toggleBlockUser(userId);
  };

  const handleBlockNewUser = (userId) => {
    toggleBlockUser(userId);
    setShowBlockSelect(false);
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 20000 }}>
      <div
        className="modal-card animate-fade-in-up"
        style={{
          maxWidth: '560px',
          width: '92%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          background: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          borderRadius: '16px',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'none',
            border: 'none',
            color: 'var(--icon-default)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '18px', paddingRight: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.14)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <UserX size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Blocked Users
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Blocked contacts cannot call or send messages to you
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowBlockSelect(!showBlockSelect)}
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
            }}
          >
            <UserX size={15} /> Block User
          </button>
        </div>

        {/* Block User Select Area */}
        {showBlockSelect && (
          <div
            style={{
              background: 'var(--bg-header)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Select a contact to block:
            </div>
            {unblockedList.length === 0 ? (
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>No other contacts available to block.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                {unblockedList.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: 'var(--bg-sidebar)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.username)}`}
                        alt={u.username}
                        style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                      />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{u.username}</span>
                    </div>

                    <button
                      onClick={() => handleBlockNewUser(u.id)}
                      style={{
                        background: 'rgba(239,68,68,0.12)',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Block
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search blocked users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-header)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '8px 12px 8px 34px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
            }}
          />
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
          {filteredBlocked.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px', background: 'var(--bg-header)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <UserX size={22} color="var(--text-secondary)" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>No blocked users</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Users you block will appear here
              </div>
            </div>
          ) : (
            filteredBlocked.map((user) => (
              <div
                key={user.id}
                style={{
                  background: 'var(--bg-header)',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`}
                    alt={user.username}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {user.username}
                    </div>
                    <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
                      Blocked Contact
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleUnblock(user.id)}
                  style={{
                    background: 'var(--accent-green)',
                    border: 'none',
                    color: 'var(--accent-contrast-text)',
                    borderRadius: '8px',
                    padding: '7px 14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Unlock size={14} /> Unblock
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
