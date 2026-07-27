import React from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useChat } from '../context/ChatContext';

export default function InAppNotification() {
  const { inAppNotification, dismissNotification, setActiveUser, allUsers } = useChat();

  if (!inAppNotification) return null;

  const handleOpenChat = () => {
    const sender = allUsers.find(u => u.id === inAppNotification.senderId);
    if (sender) {
      setActiveUser(sender);
    }
    dismissNotification();
  };

  return (
    <div
      onClick={handleOpenChat}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        background: 'var(--bg-sidebar, #121212)',
        border: '1px solid var(--border-color, #1e293b)',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        maxWidth: '360px',
        width: 'calc(100vw - 40px)',
        animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <img
        src={inAppNotification.senderAvatar}
        alt={inAppNotification.senderName}
        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary, #fff)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MessageSquare size={14} color="var(--accent-color, #3b82f6)" />
          {inAppNotification.senderName}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {inAppNotification.content}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          dismissNotification();
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary, #94a3b8)',
          cursor: 'pointer',
          padding: '4px',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
