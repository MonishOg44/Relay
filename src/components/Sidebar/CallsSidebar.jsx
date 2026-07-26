import React, { useState, useEffect } from 'react';
import { useVoiceCall } from '../../context/VoiceCallContext';
import { useChat } from '../../context/ChatContext';
import { Search, Phone, PhoneIncoming, PhoneOutgoing, PhoneOff, UserPlus, Trash2, ArrowDownLeft, ArrowUpRight, Sparkles } from 'lucide-react';
import UserSearchModal from '../Chat/UserSearchModal';

export default function CallsSidebar() {
  const { callHistory, missedCount, markMissedCallsRead, startCall, deleteCallRecord, clearCallHistory } = useVoiceCall();
  const { allUsers = [], onlineUsers, setActiveUser } = useChat();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // 'All' | 'Missed'
  const [showCallUserModal, setShowCallUserModal] = useState(false);

  // Mark missed calls as read when user switches to 'Missed' tab
  useEffect(() => {
    if (activeFilter === 'Missed' && missedCount > 0) {
      markMissedCallsRead();
    }
  }, [activeFilter, missedCount, markMissedCallsRead]);

  // Filter call history by search and tab
  const filteredCalls = callHistory.filter((call) => {
    const username = call.user?.username || '';
    const email = call.user?.email || '';
    const matchesSearch = username.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());

    if (activeFilter === 'Missed') {
      return matchesSearch && (call.type === 'missed' || call.status === 'missed');
    }
    return matchesSearch;
  });

  const formatCallTime = (isoStr) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleStartCallWithUser = (user) => {
    if (user) {
      startCall(user);
    }
  };

  return (
    <div className="sidebar-panel">
      {/* Centered Header */}
      <div className="sidebar-header">
        <h1>Calls</h1>
      </div>

      {/* Search Input */}
      <div className="search-container">
        <div className="search-box">
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search call log or contact"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['All', 'Missed'].map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${activeFilter === tab ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab)}
              style={{ position: 'relative' }}
            >
              {tab}
              {tab === 'Missed' && missedCount > 0 && (
                <span
                  style={{
                    marginLeft: '6px',
                    background: '#ff4b4b',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '10px',
                  }}
                >
                  {missedCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {callHistory.length > 0 && (
          <button
            onClick={clearCallHistory}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '11.5px',
              cursor: 'pointer',
              padding: '4px 8px',
              opacity: 0.8,
            }}
            title="Clear all calls"
          >
            Clear log
          </button>
        )}
      </div>

      {/* Calls List */}
      <div className="chat-list">
        {filteredCalls.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'rgba(0,168,132,0.1)', color: '#00a884',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              {activeFilter === 'Missed' ? <PhoneOff size={24} color="#ff4b4b" /> : <Phone size={24} />}
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {activeFilter === 'Missed' ? 'No missed calls' : 'No call history'}
            </div>
            <div style={{ fontSize: '12px', maxWidth: '240px', margin: '0 auto 16px', opacity: 0.8 }}>
              {activeFilter === 'Missed'
                ? 'Incoming missed calls will appear here'
                : 'Start a voice call with your contacts anytime'}
            </div>
            <button
              onClick={() => setShowCallUserModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(0,168,132,0.12)', border: '1px solid rgba(0,168,132,0.3)',
                color: '#00a884', borderRadius: '8px', padding: '8px 16px',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <Phone size={15} /> Make a Call
            </button>
          </div>
        ) : (
          filteredCalls.map((call) => {
            const isOnline = onlineUsers.has(call.user?.id) || call.user?.is_online;
            const isMissed = call.type === 'missed' || call.status === 'missed';

            return (
              <div
                key={call.id}
                className="chat-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div className="chat-avatar" style={{ position: 'relative', flexShrink: 0 }}>
                    <img
                      src={call.user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${call.user?.username || 'user'}`}
                      alt={call.user?.username}
                      style={{ width: '44px', height: '44px', borderRadius: '50%' }}
                    />
                    {isOnline && <div className="online-dot" style={{ bottom: 0, right: 0 }} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: '14.5px',
                        fontWeight: isMissed ? 700 : 600,
                        color: isMissed ? '#ff4b4b' : 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {call.user?.username || 'User'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {formatCallTime(call.timestamp)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      {isMissed ? (
                        <>
                          <ArrowDownLeft size={14} color="#ff4b4b" />
                          <span style={{ fontSize: '12px', color: '#ff4b4b', fontWeight: 500 }}>
                            Missed call
                          </span>
                        </>
                      ) : call.type === 'incoming' ? (
                        <>
                          <ArrowDownLeft size={14} color="#00a884" />
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Incoming ({call.duration})
                          </span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight size={14} color="#53bdeb" />
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Outgoing ({call.duration})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                  <button
                    onClick={() => handleStartCallWithUser(call.user)}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'rgba(0,168,132,0.12)',
                      border: 'none',
                      color: '#00a884',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title={`Call ${call.user?.username}`}
                  >
                    <Phone size={16} />
                  </button>

                  <button
                    onClick={() => deleteCallRecord(call.id)}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      opacity: 0.6,
                    }}
                    title="Delete record"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showCallUserModal && (
        <UserSearchModal
          onClose={() => setShowCallUserModal(false)}
          onCallUser={(user) => {
            setShowCallUserModal(false);
            startCall(user);
          }}
        />
      )}
    </div>
  );
}
