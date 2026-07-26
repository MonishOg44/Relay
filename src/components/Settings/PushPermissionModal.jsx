import React from 'react';
import { Bell, X } from 'lucide-react';

export default function PushPermissionModal({ isOpen, onClose, onAccept }) {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay animate-fade-in"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        className="animate-slide-up"
        style={{
          background: 'var(--bg-panel)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '360px',
          overflow: 'hidden',
          boxShadow: '0 24px 50px rgba(0,0,0,0.3)',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ position: 'relative', padding: '32px 24px 24px' }}>
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(128, 128, 128, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            <X size={18} />
          </button>

          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--accent-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
          }}>
            <Bell size={32} color="var(--accent-contrast-text)" />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 12px', color: 'var(--text-primary)' }}>
            Stay in the Loop
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.5 }}>
            Enable push notifications to know instantly when you receive a message, even when Relay is closed.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={onAccept}
              style={{
                width: '100%',
                padding: '14px',
                background: 'var(--accent-green)',
                color: 'var(--accent-contrast-text)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
            >
              Turn On Notifications
            </button>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
