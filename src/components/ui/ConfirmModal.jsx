import React from 'react';
import { AlertTriangle, Trash2, LogOut, X, Check } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'info'
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 size={24} color="#ef4444" />;
      case 'warning':
        return <LogOut size={24} color="#f59e0b" />;
      default:
        return <AlertTriangle size={24} color="var(--accent-green)" />;
    }
  };

  const getConfirmBg = () => {
    switch (type) {
      case 'danger':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return 'var(--accent-green)';
    }
  };

  return (
    <div
      className="modal-overlay animate-fade-in"
      style={{
        zIndex: 5000,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="modal-card confirm-modal-card animate-fade-in-up"
        style={{
          width: '380px',
          maxWidth: '90%',
          padding: '24px',
          borderRadius: '16px',
          background: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          position: 'relative',
        }}
      >
        <button
          className="confirm-close-btn"
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* Icon Badge */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: type === 'danger' ? 'rgba(239,68,68,0.12)' : type === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(0,168,132,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          {getIcon()}
        </div>

        <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary)' }}>
          {title}
        </h3>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: '1.4' }}>
          {message}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'var(--bg-header)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            style={{
              background: getConfirmBg(),
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
