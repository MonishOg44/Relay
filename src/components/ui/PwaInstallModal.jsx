import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Share2, PlusSquare, Check } from 'lucide-react';

export default function PwaInstallModal({ forceShow = false, onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if already running in standalone PWA mode
    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    setIsStandalone(inStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(iosDevice);

    // Listen for native beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Auto prompt if not dismissed previously and not in standalone
    const dismissed = localStorage.getItem('relay_pwa_dismissed');
    if (forceShow) {
      setVisible(true);
    } else if (!dismissed && !inStandalone) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [forceShow]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        setTimeout(() => {
          setVisible(false);
          onClose?.();
        }, 1800);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback message for browsers without beforeinstallprompt
      alert('To install Relay: Click your browser menu (⋮ or ⊕) and select "Install Relay" or "Add to Home Screen".');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('relay_pwa_dismissed', 'true');
    setVisible(false);
    onClose?.();
  };

  if (isStandalone || !visible) return null;

  return (
    <div className="modal-overlay pwa-modal-overlay animate-fade-in" style={{ zIndex: 4000 }}>
      <div
        className="modal-card pwa-install-card animate-fade-in-up"
        style={{
          maxWidth: '440px',
          width: '92%',
          padding: '28px 24px',
          background: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          borderRadius: '20px',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--icon-default)',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={20} />
        </button>

        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <img
            src="/quality_restoration_20260724180021934.JPEG"
            alt="Relay Logo"
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              objectFit: 'cover',
              margin: '0 auto 12px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
              display: 'block',
            }}
          />
          <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Install Relay App
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Add Relay to your Desktop or Home Screen for instant access & native app experience!
          </p>
        </div>

        {/* Instructions Box */}
        <div
          style={{
            background: 'var(--bg-header)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '20px',
            fontSize: '12.5px',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {isIos ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                <Share2 size={16} color="var(--accent-green)" />
                1. Tap the Share button in Safari
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                <PlusSquare size={16} color="var(--accent-green)" />
                2. Select "Add to Home Screen"
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                <Monitor size={16} color="var(--accent-green)" />
                Desktop: Click "Install" for taskbar shortcut
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
                <Smartphone size={16} color="var(--accent-green)" />
                Mobile: Add to Home Screen for fullscreen mode
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDismiss}
            style={{
              flex: 1,
              background: 'var(--bg-header)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Not Now
          </button>

          <button
            onClick={handleInstallClick}
            disabled={installed}
            style={{
              flex: 1.4,
              background: installed ? 'rgba(0,168,132,0.15)' : 'var(--accent-green)',
              color: installed ? 'var(--accent-green)' : 'var(--accent-contrast-text, #ffffff)',
              border: installed ? '1px solid var(--accent-green)' : 'none',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: installed ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {installed ? (
              <>
                <Check size={18} /> Installed!
              </>
            ) : (
              <>
                <Download size={18} /> Install App
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
