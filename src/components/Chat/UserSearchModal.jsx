import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Search, X, MessageSquare, UserPlus, Phone, UserCheck, Clock, User, Bell } from 'lucide-react';
import UserProfileModal from './UserProfileModal';
import { supabase } from '../../lib/supabaseClient';

export default function UserSearchModal({ onClose, onCallUser }) {
  const { allUsers = [], setActiveUser, onlineUsers, friendships, getFriendship } = useChat();
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'requests'
  const [selectedUser, setSelectedUser] = useState(null);

  const trimmedQuery = query.trim().toLowerCase();
  
  const searchResults = trimmedQuery
    ? allUsers.filter((u) => {
        const usernameLower = u.username.toLowerCase();
        const emailLower = u.email.toLowerCase();
        const emailPrefix = emailLower.split('@')[0];
        return (
          usernameLower.startsWith(trimmedQuery) ||
          emailPrefix.startsWith(trimmedQuery) ||
          emailLower.startsWith(trimmedQuery)
        );
      })
    : [];

  const incomingRequests = friendships.filter(f => f.receiver_id === profile?.id && f.status === 'pending');
  const outgoingRequests = friendships.filter(f => f.requester_id === profile?.id && f.status === 'pending');

  const incomingUsers = incomingRequests.map(req => allUsers.find(u => u.id === req.requester_id)).filter(Boolean);
  const outgoingUsers = outgoingRequests.map(req => allUsers.find(u => u.id === req.receiver_id)).filter(Boolean);

  const getPrivacyMaskedAvatar = (user) => {
    if (!profile) return '';
    if (user.id === profile.id) return user.avatar_url;
    const isFriend = getFriendship(user.id)?.status === 'accepted';
    
    // Default to 'friends' if not set
    const picPrivacy = user.privacy_profile_picture || 'friends';
    
    if (picPrivacy === 'nobody') return `https://api.dicebear.com/7.x/bottts/svg?seed=hidden`;
    if (picPrivacy === 'friends' && !isFriend) return `https://api.dicebear.com/7.x/bottts/svg?seed=hidden`;
    
    return user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`;
  };

  const handleAction = async (user, actionType) => {
    const f = getFriendship(user.id);
    try {
      if (actionType === 'accept' && f) {
        await supabase.from('friendships').update({ status: 'accepted' }).eq('id', f.id);
      } else if (actionType === 'cancel' && f) {
        await supabase.from('friendships').delete().eq('id', f.id);
      } else if (actionType === 'add' && !f) {
        await supabase.from('friendships').insert({ requester_id: profile.id, receiver_id: user.id, status: 'pending' });
      }
    } catch (err) { console.error(err); }
  };

  const renderUserRow = (u, type = 'search') => {
    const isOnline = onlineUsers.has(u.id) || u.is_online;
    const f = getFriendship(u.id);
    const isFriend = f?.status === 'accepted';
    const isPendingSent = f?.status === 'pending' && f.requester_id === profile?.id;
    const isPendingReceived = f?.status === 'pending' && f.receiver_id === profile?.id;

    // For privacy masking, we hide the status message if not friends
    const displayStatus = isFriend ? (u.status_message || u.email) : 'Profile private';

    return (
      <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-header)', border: '1px solid var(--border-color)', transition: 'all 0.15s ease' }} className="chat-item">
        <div onClick={() => setSelectedUser(u)} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }}>
          <div style={{ position: 'relative' }}>
            <img src={getPrivacyMaskedAvatar(u)} alt="" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} />
            {isOnline && <div className="online-dot" style={{ bottom: 0, right: 0 }} />}
          </div>
          <div>
            <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{u.username}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{displayStatus}</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '6px' }}>
          {isFriend ? (
            <button onClick={() => { setActiveUser(u); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-search)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              <MessageSquare size={14} /> Message
            </button>
          ) : isPendingReceived ? (
            <button onClick={() => handleAction(u, 'accept')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent-green)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              <UserCheck size={14} /> Accept
            </button>
          ) : isPendingSent ? (
            <button onClick={() => handleAction(u, 'cancel')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-search)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              <Clock size={14} /> Requested
            </button>
          ) : (
            <button onClick={() => handleAction(u, 'add')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,168,132,0.1)', border: '1px solid rgba(0,168,132,0.3)', color: 'var(--accent-green)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              <UserPlus size={14} /> Add
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-card animate-fade-in-up" style={{ maxWidth: '480px', padding: '24px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', color: 'var(--icon-default)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(0,168,132,0.12)', color: '#00a884' }}>
            <UserPlus size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Find Users & Requests</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Connect with the Relay network</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('search')}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
              background: activeTab === 'search' ? 'var(--bg-input)' : 'transparent',
              border: `1px solid ${activeTab === 'search' ? 'var(--border-color)' : 'transparent'}`,
              color: activeTab === 'search' ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <Search size={16} /> Search
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
              background: activeTab === 'requests' ? 'var(--bg-input)' : 'transparent',
              border: `1px solid ${activeTab === 'requests' ? 'var(--border-color)' : 'transparent'}`,
              color: activeTab === 'requests' ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <Bell size={16} /> Requests
            {incomingRequests.length > 0 && (
              <div style={{ background: '#ef4444', color: '#fff', fontSize: '11px', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>
                {incomingRequests.length}
              </div>
            )}
          </button>
        </div>

        {activeTab === 'search' && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'var(--bg-search)', borderRadius: '10px',
              padding: '10px 14px', border: '1px solid var(--border-color)',
              marginBottom: '16px'
            }}>
              <Search size={18} color="#00a884" />
              <input
                type="text"
                autoFocus
                placeholder="Type a username or email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '13.5px' }}
              />
            </div>

            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {!trimmedQuery ? (
                <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Type a username or email address above to search registered users
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  No user found starting with "{query}"
                </div>
              ) : (
                searchResults.map(u => renderUserRow(u, 'search'))
              )}
            </div>
          </>
        )}

        {activeTab === 'requests' && (
          <div style={{ maxHeight: '330px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Incoming Requests */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', paddingLeft: '4px' }}>INCOMING ({incomingUsers.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {incomingUsers.length === 0 ? (
                  <div style={{ padding: '16px 12px', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', background: 'var(--bg-header)', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
                    No incoming requests
                  </div>
                ) : (
                  incomingUsers.map(u => renderUserRow(u, 'incoming'))
                )}
              </div>
            </div>

            {/* Outgoing Requests */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', paddingLeft: '4px' }}>SENT ({outgoingUsers.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {outgoingUsers.length === 0 ? (
                  <div style={{ padding: '16px 12px', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', background: 'var(--bg-header)', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
                    No sent requests
                  </div>
                ) : (
                  outgoingUsers.map(u => renderUserRow(u, 'outgoing'))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <UserProfileModal 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
        user={selectedUser} 
        isOnline={selectedUser && (onlineUsers.has(selectedUser.id) || selectedUser?.is_online)} 
      />
    </div>
  );
}
