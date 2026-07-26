import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { LogOut, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function SignOutModal({ isOpen, onClose, onConfirm, profile }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!isOpen) return null;

  if (isSigningOut) {
    return ReactDOM.createPortal(
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999999,
          background: isDark ? '#000000' : '#ffffff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: isDark ? '#ffffff' : '#000000'
        }}
      >
        <Loader2 size={36} className="animate-spin" style={{ marginBottom: '16px', color: '#00a884' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.5px' }}>Signing out...</h2>
      </div>,
      document.body
    );
  }

  const handleConfirm = async () => {
    setIsSigningOut(true);
    setTimeout(async () => {
      await onConfirm();
    }, 450);
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999999,
        background: isDark ? '#000000' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: '24px',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          margin: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Title */}
        <h2
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: isDark ? '#ffffff' : '#0f172a',
            letterSpacing: '-0.5px',
            marginBottom: '10px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          Sign Out of Relay?
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: '14px',
            color: isDark ? 'rgba(255, 255, 255, 0.62)' : 'rgba(15, 23, 42, 0.62)',
            lineHeight: 1.55,
            marginBottom: '26px',
            maxWidth: '370px',
          }}
        >
          Are you sure you want to log out? Your active session will be closed and real-time updates will pause.
        </p>

        {/* User Card Pill */}
        {profile && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
              borderRadius: '30px',
              padding: '7px 16px 7px 9px',
              marginBottom: '34px',
              boxShadow: 'none',
            }}
          >
            <img
              src={profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`}
              alt={profile.username}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '1.5px solid #ef4444',
                objectFit: 'cover',
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#ffffff' : '#0f172a' }}>
              {profile.username}
            </span>
            <span style={{ fontSize: '11.5px', color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.45)' }}>
              ({profile.email})
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            maxWidth: '340px',
          }}
        >
          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isSigningOut}
            style={{
              flex: 1,
              padding: '12px 22px',
              borderRadius: '26px',
              background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
              color: isDark ? '#ffffff' : '#0f172a',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'none',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9';
            }}
          >
            Cancel
          </button>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSigningOut}
            style={{
              flex: 1.1,
              padding: '12px 24px',
              borderRadius: '26px',
              background: '#ef4444',
              border: 'none',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: isSigningOut ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'none',
              transition: 'opacity 0.15s ease',
              opacity: isSigningOut ? 0.75 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSigningOut) {
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSigningOut) {
                e.currentTarget.style.opacity = '1';
              }
            }}
          >
            {isSigningOut ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut size={16} /> Sign Out
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
