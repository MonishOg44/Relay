import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

export default function MessageBubble({ message, isOwn, senderAvatar }) {
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '10px',
        marginBottom: '14px',
        maxWidth: '80%',
        alignSelf: isOwn ? 'flex-end' : 'flex-start'
      }}
    >
      {!isOwn && (
        <img
          src={senderAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=avatar'}
          alt=""
          style={{ width: '28px', height: '28px', borderRadius: '10px', marginBottom: '2px' }}
        />
      )}

      <div
        style={{
          background: isOwn ? 'var(--chat-sender-bg)' : 'var(--chat-receiver-bg)',
          color: '#ffffff',
          padding: '12px 16px',
          borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          border: isOwn ? 'none' : '1px solid var(--glass-border)',
          boxShadow: isOwn ? '0 4px 15px var(--accent-glow)' : 'none',
          position: 'relative',
          wordBreak: 'break-word',
          fontSize: '14px',
          lineHeight: '1.4'
        }}
      >
        <div>{message.content}</div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '4px',
            marginTop: '4px',
            fontSize: '10px',
            color: isOwn ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-muted)'
          }}
        >
          <span>{formatTime(message.created_at)}</span>
          {isOwn && (
            <span>
              {message.is_read ? (
                <CheckCheck size={14} color="#60a5fa" title="Read" />
              ) : (
                <Check size={14} color="rgba(255, 255, 255, 0.7)" title="Sent" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
