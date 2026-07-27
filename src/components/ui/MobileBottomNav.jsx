import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, Sparkles, UserPlus, Settings, Grid2X2, X } from 'lucide-react';
import { useVoiceCall } from '../../context/VoiceCallContext';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import StaggeredMenu from './StaggeredMenu';

const hiddenToggle = () => <div style={{ display: 'none' }} />;

export default function MobileBottomNav({
  activeNav,
  setActiveNav,
  onOpenSettings,
  onOpenAiModal,
  onOpenSearchModal,
  menuItems = [],
  socialItems = [],
  unreadCount = 0,
}) {
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const { missedCount } = useVoiceCall();
  const { pendingRequestCount = 0 } = useChat() || {};
  const themeContext = useTheme();
  const theme = themeContext?.theme || 'dark';
  const isLight = theme === 'light';

  // Lock background scroll when the Staggered Menu is open
  useEffect(() => {
    if (showControlCenter) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [showControlCenter]);

  const navItems = [
    {
      id: 'chats',
      icon: MessageSquare,
      label: 'Chats',
      badge: unreadCount,
      onClick: () => {
        setShowControlCenter(false);
        setActiveNav('chats');
      },
    },
    {
      id: 'calls',
      icon: Phone,
      label: 'Calls',
      badge: missedCount,
      onClick: () => {
        setShowControlCenter(false);
        setActiveNav('calls');
      },
    },

    {
      id: 'search',
      icon: UserPlus,
      label: 'New',
      badge: pendingRequestCount,
      onClick: () => {
        setShowControlCenter(false);
        onOpenSearchModal();
      },
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      badge: 0,
      onClick: () => {
        setShowControlCenter(false);
        onOpenSettings();
      },
    },
    {
      id: 'menu',
      icon: Grid2X2,
      label: 'Menu',
      badge: 0,
      onClick: () => setShowControlCenter(!showControlCenter),
    },
  ];

  return (
    <>
      <StaggeredMenu
        isFixed={true}
        position="bottom"
        items={menuItems}
        socialItems={socialItems}
        displaySocials={true}
        displayItemNumbering={true}
        isOpen={showControlCenter}
        closeOnClickAway={false}
        onMenuClose={() => setShowControlCenter(false)}
        customToggle={hiddenToggle}
        colors={['var(--bg-header)', 'var(--bg-hover)', 'var(--bg-sidebar)']}
        accentColor="var(--accent-green)"
      />

      {/* Pill-Shaped Glassmorphic Nav Bar with Sliding Indicator */}
      <div
        className="mobile-bottom-nav animate-fade-in-up"
        onTouchMove={(e) => {
          // Track sliding finger to visually move the pill without triggering clicks yet
          const touch = e.touches[0];
          const navBar = e.currentTarget;
          const rect = navBar.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const itemWidth = rect.width / navItems.length;
          const newIndex = Math.max(0, Math.min(navItems.length - 1, Math.floor(x / itemWidth)));
          if (dragIndex !== newIndex) {
            setDragIndex(newIndex);
          }
        }}
        onTouchEnd={() => {
          // Commit the tab change only when the user lifts their finger
          if (dragIndex !== null) {
            const newItem = navItems[dragIndex];
            if (newItem) newItem.onClick();
            setDragIndex(null);
          }
        }}
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          right: '16px',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px',
          height: '64px',
          background: isLight
            ? 'rgba(255, 255, 255, 0.75)'
            : 'rgba(28, 28, 30, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '32px',
          border: isLight
            ? '1px solid rgba(0, 0, 0, 0.05)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isLight
            ? '0 8px 32px rgba(0,0,0,0.08)'
            : '0 8px 32px rgba(0,0,0,0.4)',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
        }}
      >
        {/* Sliding Active Pill Indicator */}
        <div 
          style={{
            position: 'absolute',
            top: '6px',
            bottom: '6px',
            left: '8px',
            width: `calc((100% - 16px) / ${navItems.length})`,
            transform: `translateX(${(dragIndex !== null ? dragIndex : navItems.findIndex(i => i.id === (showControlCenter ? 'menu' : activeNav))) * 100}%)`,
            background: 'var(--bg-active)',
            borderRadius: '26px',
            boxShadow: 'none',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            pointerEvents: 'none',
            zIndex: 1,
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        />
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = dragIndex !== null 
            ? dragIndex === index 
            : (showControlCenter && item.id === 'menu') || (!showControlCenter && activeNav === item.id);

          return (
              <button
              key={item.id}
              onClick={item.onClick}
              style={{
                position: 'relative',
                flex: 1,
                height: '100%',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                zIndex: 2,
                color: isActive ? 'var(--accent-green)' : 'var(--text-secondary)',
                transition: 'color 0.2s ease',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
            >
              <Icon
                size={24}
                strokeWidth={2}
                style={{
                  transition: 'transform 0.2s ease',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}
              />

              {item.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: 'calc(50% - 16px)',
                    width: '18px',
                    height: '18px',
                    borderRadius: '9px',
                    background: '#ef4444',
                    border: isLight ? '2px solid #ffffff' : '2px solid #000000',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
