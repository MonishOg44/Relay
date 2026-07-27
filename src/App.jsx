import React, { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import { VoiceCallProvider, useVoiceCall } from './context/VoiceCallContext';
import VoiceCallModal from './components/Chat/VoiceCallModal';
import IntroAnimation from './components/IntroAnimation';
import AuthScreen from './components/Auth/AuthScreen';
import Sidebar from './components/Sidebar/Sidebar';
import CallsSidebar from './components/Sidebar/CallsSidebar';
import ChatArea from './components/Chat/ChatArea';
import UserSearchModal from './components/Chat/UserSearchModal';
import ConfigModal from './components/Chat/ConfigModal';
import AppSettingsModal from './components/Settings/AppSettingsModal';
import ChatAnalyticsModal from './components/Analytics/ChatAnalyticsModal';
import RelayAiModal from './components/Chat/RelayAiModal';
import StaggeredMenu from './components/ui/StaggeredMenu';
import MobileBottomNav from './components/ui/MobileBottomNav';
import CalendarModal from './components/Modals/CalendarModal';
import PinnedChatsModal from './components/Modals/PinnedChatsModal';
import FavouritesModal from './components/Modals/FavouritesModal';
import BlockedUsersModal from './components/Modals/BlockedUsersModal';
import SharedFilesModal from './components/Modals/SharedFilesModal';
import ArchiveModal from './components/Modals/ArchiveModal';
import SubscriptionsModal from './components/Modals/SubscriptionsModal';
import PwaInstallModal from './components/ui/PwaInstallModal';
import EventNotifier from './components/EventNotifier';
import InAppNotification from './components/InAppNotification';
import { PushService } from './lib/PushService';
import { MessageSquare, Phone, Settings, Sparkles, UserPlus, Grid2X2, X } from 'lucide-react';

const customNavToggle = (isOpen) => (
  <div className={`nav-item ${isOpen ? 'active' : ''}`}>
    {isOpen ? <X size={20} /> : <Grid2X2 size={20} />}
  </div>
);

function NavRail({
  activeNav,
  setActiveNav,
  onOpenSettings,
  onOpenAiModal,
  onOpenSearchModal,
  menuItems,
  socialItems,
  onMenuOpen,
  onMenuClose,
}) {
  const { missedCount } = useVoiceCall();
  const { pendingRequestCount = 0 } = useChat() || {};

  return (
    <nav className="nav-rail">
      {/* 1. Chats */}
      <button
        className={`nav-item ${activeNav === 'chats' ? 'active' : ''}`}
        onClick={() => setActiveNav('chats')}
        title="Chats"
      >
        <MessageSquare size={20} />
      </button>

      {/* 2. Calls */}
      <button
        className={`nav-item ${activeNav === 'calls' ? 'active' : ''}`}
        onClick={() => setActiveNav('calls')}
        title="Calls"
        style={{ position: 'relative' }}
      >
        <Phone size={20} />
        {missedCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: '#ff4b4b',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {missedCount}
          </span>
        )}
      </button>

      {/* 3. Relay AI Assistant Button */}
      <button
        className="nav-item nav-item-ai"
        onClick={onOpenAiModal}
        title="Ask Relay AI"
      >
        <Sparkles size={20} />
      </button>

      {/* 4. Find Contacts & Requests Button */}
      <button
        className="nav-item nav-item-contacts"
        onClick={onOpenSearchModal}
        title="Find Contacts & Requests"
        style={{ position: 'relative' }}
      >
        <UserPlus size={20} />
        {pendingRequestCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {pendingRequestCount}
          </span>
        )}
      </button>

      {/* 5. Settings Button */}
      <button className="nav-item" onClick={onOpenSettings} title="Settings">
        <Settings size={20} />
      </button>

      {/* 6. Circular Staggered Menu Toggle Button */}
      <div className="nav-item-wrapper" title="Navigation Menu">
        <StaggeredMenu
          isFixed={true}
          position="left"
          items={menuItems}
          socialItems={socialItems}
          displaySocials={false}
          displayItemNumbering={true}
          closeOnClickAway={false}
          onMenuOpen={onMenuOpen}
          onMenuClose={onMenuClose}
          menuButtonColor="var(--text-primary)"
          openMenuButtonColor="var(--text-primary)"
          changeMenuColorOnOpen={false}
          colors={['var(--bg-header)', 'var(--bg-hover)', 'var(--bg-sidebar)']}
          accentColor="var(--accent-green)"
          customToggle={customNavToggle}
        />
      </div>

      <div className="nav-spacer" />
    </nav>
  );
}

function MainContent({
  showConfig,
  setShowConfig,
  showSettings,
  setShowSettings,
  showAnalytics,
  setShowAnalytics,
  showAiModal,
  setShowAiModal,
  showSearchModal,
  setShowSearchModal,
  menuItems,
  socialItems,
}) {
  const { activeUser } = useChat();
  const [activeNav, setActiveNav] = useState('chats');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className={`app-shell ${isMenuOpen ? 'is-menu-open' : ''} ${activeUser ? 'has-active-chat' : 'no-active-chat'}`}>
      <NavRail
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        onOpenSettings={() => {
          setShowAiModal(false);
          setShowSearchModal(false);
          setShowSettings(true);
        }}
        onOpenAiModal={() => {
          setShowSettings(false);
          setShowSearchModal(false);
          setShowAiModal(true);
        }}
        onOpenSearchModal={() => {
          setShowSettings(false);
          setShowAiModal(false);
          setShowSearchModal(true);
        }}
        menuItems={menuItems}
        socialItems={socialItems}
        onMenuOpen={() => setIsMenuOpen(true)}
        onMenuClose={() => setIsMenuOpen(false)}
      />
      <MobileBottomNav
        activeNav={showAiModal ? 'ai' : showSearchModal ? 'search' : showSettings ? 'settings' : isMenuOpen ? 'menu' : activeNav}
        setActiveNav={(nav) => {
          setShowAiModal(false);
          setShowSearchModal(false);
          setShowSettings(false);
          setIsMenuOpen(false);
          setActiveNav(nav);
        }}
        onOpenSettings={() => {
          setShowAiModal(false);
          setShowSearchModal(false);
          setShowSettings(true);
        }}
        onOpenAiModal={() => {
          setShowSettings(false);
          setShowSearchModal(false);
          setShowAiModal(true);
        }}
        onOpenSearchModal={() => {
          setShowSettings(false);
          setShowAiModal(false);
          setShowSearchModal(true);
        }}
        menuItems={menuItems}
        socialItems={socialItems}
      />
      {activeNav === 'calls' ? (
        <CallsSidebar />
      ) : (
        <Sidebar
          onOpenConfig={() => setShowConfig(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenAnalytics={() => setShowAnalytics(true)}
        />
      )}
      <ChatArea />
    </div>
  );
}

function MainLayout() {
  const { user, logout, loading } = useAuth();
  const [showConfig, setShowConfig] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPinnedChats, setShowPinnedChats] = useState(false);
  const [showFavourites, setShowFavourites] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showSharedFiles, setShowSharedFiles] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [showPwaInstall, setShowPwaInstall] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  const isAnyModalOpen = Boolean(
    showConfig || showSettings || showAnalytics || showCalendar ||
    showPinnedChats || showFavourites || showBlockedUsers || showSharedFiles ||
    showArchive || showSubscriptions || showAiModal || showSearchModal || showPwaInstall
  );

  React.useEffect(() => {
    if (isAnyModalOpen) {
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
    } else {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    };
  }, [isAnyModalOpen]);

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
  }, []);

  // Auto-subscribe to push notifications if permission was previously granted
  React.useEffect(() => {
    if (user?.id && 'Notification' in window && Notification.permission === 'granted') {
      PushService.subscribeToPush(user.id).catch(() => {});
    }
  }, [user?.id]);

  if (!introComplete) {
    return <IntroAnimation onComplete={handleIntroComplete} />;
  }

  if (loading) {
    return (
      <div style={{
        height: '100vh', width: '100vw',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-app)', color: 'var(--text-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '36px', height: '36px',
            border: '3px solid var(--border-color)', borderTopColor: '#00a884',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
            margin: '0 auto 14px'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '13px' }}>Loading Relay...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const menuItems = [
    { label: 'Install Relay', ariaLabel: 'Install Relay App', onClick: () => setShowPwaInstall(true) },
    { label: 'Analytics', ariaLabel: 'View Chat Analytics', onClick: () => setShowAnalytics(true) },
    { label: 'Calendar', ariaLabel: 'Open Calendar & Calls Schedule', onClick: () => setShowCalendar(true) },
    { label: 'Pinned Chats', ariaLabel: 'View Pinned Chats', onClick: () => setShowPinnedChats(true) },
    { label: 'Blocked Users', ariaLabel: 'View Blocked Users List', onClick: () => setShowBlockedUsers(true) },
    { label: 'Shared Files', ariaLabel: 'View Shared Files', onClick: () => setShowSharedFiles(true) },
    { label: 'Archive', ariaLabel: 'View Archived Chats', onClick: () => setShowArchive(true) },
    { label: 'Subscriptions', ariaLabel: 'View Subscriptions & Plans', onClick: () => setShowSubscriptions(true) },
  ];

  const socialItems = [
    { label: 'Supabase DB', link: 'https://supabase.com' },
    { label: 'WebRTC P2P', link: 'https://webrtc.org' },
    { label: 'GitHub', link: 'https://github.com' }
  ];

  return (
    <VoiceCallProvider>
      <ChatProvider>
        <MainContent
          showConfig={showConfig}
          setShowConfig={setShowConfig}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          showAnalytics={showAnalytics}
          setShowAnalytics={setShowAnalytics}
          showAiModal={showAiModal}
          setShowAiModal={setShowAiModal}
          showSearchModal={showSearchModal}
          setShowSearchModal={setShowSearchModal}
          menuItems={menuItems}
          socialItems={socialItems}
        />

        {showConfig && <ConfigModal onClose={() => setShowConfig(false)} />}
        {showSettings && <AppSettingsModal onClose={() => setShowSettings(false)} />}
        {showAnalytics && <ChatAnalyticsModal onClose={() => setShowAnalytics(false)} />}
        {showCalendar && <CalendarModal onClose={() => setShowCalendar(false)} />}
        {showPinnedChats && <PinnedChatsModal onClose={() => setShowPinnedChats(false)} />}
        {showFavourites && <FavouritesModal onClose={() => setShowFavourites(false)} />}
        {showBlockedUsers && <BlockedUsersModal onClose={() => setShowBlockedUsers(false)} />}
        {showSharedFiles && <SharedFilesModal onClose={() => setShowSharedFiles(false)} />}
        {showArchive && <ArchiveModal onClose={() => setShowArchive(false)} />}
        {showSubscriptions && <SubscriptionsModal onClose={() => setShowSubscriptions(false)} />}
        {showAiModal && <RelayAiModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />}
        {showSearchModal && <UserSearchModal onClose={() => setShowSearchModal(false)} />}
        {showPwaInstall ? (
          <PwaInstallModal forceShow={true} onClose={() => setShowPwaInstall(false)} />
        ) : (
          <PwaInstallModal />
        )}
        <VoiceCallModal />
        <InAppNotification />
      </ChatProvider>
    </VoiceCallProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <EventNotifier>
          <MainLayout />
        </EventNotifier>
      </AuthProvider>
    </ThemeProvider>
  );
}
