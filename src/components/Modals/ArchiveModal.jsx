import React from 'react';
import { Archive, X, ArchiveRestore, MessageSquare, Search } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export default function ArchiveModal({ onClose }) {
  const { allUsers = [], groupsList = [], archivedUserIds = new Set(), toggleArchiveUser, setActiveUser } = useChat();
  const [searchTerm, setSearchTerm] = React.useState('');

  const archivedUsers = React.useMemo(() => {
    const combined = [...groupsList, ...allUsers];
    return combined.filter((u) => archivedUserIds.has(u.id));
  }, [groupsList, allUsers, archivedUserIds]);

  const filtered = archivedUsers.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleUnarchive = (userId) => {
    toggleArchiveUser(userId);
  };

  const handleOpenChat = (user) => {
    setActiveUser(user);
    onClose();
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 3500 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', paddingRight: '36px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(0, 168, 132, 0.14)',
              color: 'var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Archive size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              Archived Chats
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Conversations stored safely out of your main chat list
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search archived chats..."
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px', background: 'var(--bg-header)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <Archive size={22} color="var(--text-secondary)" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>No archived chats</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Use the Archive option in chat options to move chats here
              </div>
            </div>
          ) : (
            filtered.map((user) => (
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
                    style={{ width: '40px', height: '40px', borderRadius: user.isGroup ? '10px' : '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {user.username}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {user.isGroup ? `${user.membersCount || 8} Members` : user.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleOpenChat(user)}
                    style={{
                      background: 'var(--accent-green)',
                      border: 'none',
                      color: 'var(--accent-contrast-text)',
                      borderRadius: '8px',
                      padding: '7px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <MessageSquare size={13} /> View
                  </button>

                  <button
                    onClick={() => handleUnarchive(user.id)}
                    title="Unarchive Chat"
                    style={{
                      background: 'var(--bg-sidebar)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ArchiveRestore size={14} color="var(--accent-green)" /> Unarchive
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
