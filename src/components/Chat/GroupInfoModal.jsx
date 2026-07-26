import React, { useMemo } from 'react';
import { Users, X, Phone, MessageSquare, Shield, LogOut, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useVoiceCall } from '../../context/VoiceCallContext';

export default function GroupInfoModal({ isOpen, onClose, group, onLeaveGroup, onDeleteGroup }) {
  const { profile } = useAuth();
  const { allUsers = [], users = [], onlineUsers = new Set(), setActiveUser } = useChat();
  const { startCall } = useVoiceCall();

  const userPool = useMemo(() => {
    return (allUsers && allUsers.length > 0) ? allUsers : (users || []);
  }, [allUsers, users]);

  const groupMembers = useMemo(() => {
    if (!group) return [];

    const memberList = [];
    // Add current user as admin
    if (profile) {
      memberList.push({
        id: profile.id,
        username: profile.username || 'You',
        email: profile.email,
        avatar_url: profile.avatar_url,
        role: 'Group Admin',
        isOnline: true,
        isSelf: true,
      });
    }

    if (group.members && Array.isArray(group.members)) {
      group.members.forEach((mId) => {
        if (mId !== profile?.id) {
          const found = userPool.find((u) => u.id === mId);
          if (found) {
            memberList.push({
              ...found,
              role: 'Member',
              isOnline: onlineUsers.has(found.id) || found.is_online,
            });
          }
        }
      });
    }

    // Fill remaining demo/team member slots if needed to match group.membersCount
    if (memberList.length < (group.membersCount || 8)) {
      const remainingUsers = userPool.filter((u) => u.id !== profile?.id && !memberList.some((m) => m.id === u.id));
      remainingUsers.forEach((u) => {
        if (memberList.length < (group.membersCount || 8)) {
          memberList.push({
            ...u,
            role: 'Member',
            isOnline: onlineUsers.has(u.id) || u.is_online,
          });
        }
      });
    }

    return memberList;
  }, [group, profile, userPool, onlineUsers]);

  if (!isOpen || !group) return null;

  const onlineCount = groupMembers.filter((m) => m.isOnline).length;

  const handleStartDirectChat = (member) => {
    if (member.isSelf) return;
    setActiveUser(member);
    onClose();
  };

  const handleStartDirectCall = (member) => {
    if (member.isSelf) return;
    setActiveUser(member);
    if (startCall) startCall(member);
    onClose();
  };

  const handleStartGroupCall = () => {
    if (startCall) startCall(group);
    onClose();
  };

  return (
    <div
      className="modal-overlay animate-fade-in"
      style={{
        zIndex: 3800,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="modal-card animate-fade-in-up"
        style={{
          maxWidth: '520px',
          width: '92%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          background: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          borderRadius: '16px',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'none',
            border: 'none',
            color: 'var(--icon-default)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {/* Group Header info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <img
              src={group.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(group.username)}`}
              alt={group.username}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '16px',
                objectFit: 'cover',
                border: '2px solid var(--border-color)',
                background: 'var(--bg-header)',
              }}
            />
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
            {group.username}
          </h3>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 8px', maxWidth: '380px' }}>
            {group.desc || 'Official Relay Team Channel'}
          </p>

          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-green)', background: 'rgba(0,168,132,0.12)', padding: '4px 12px', borderRadius: '12px' }}>
            {groupMembers.length} Members • {onlineCount} Online
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={handleStartGroupCall}
            style={{
              background: 'var(--accent-green)',
              color: 'var(--accent-contrast-text)',
              border: 'none',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Phone size={15} /> Group Call
          </button>

          <button
            onClick={() => {
              onLeaveGroup?.();
              onClose();
            }}
            style={{
              background: 'var(--bg-header)',
              border: '1px solid var(--border-color)',
              color: '#f59e0b',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <LogOut size={15} /> Leave Group
          </button>
        </div>

        {/* Members Section Title */}
        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Channel Members ({groupMembers.length})</span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {onlineCount} Online Now
          </span>
        </div>

        {/* Members List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
          {groupMembers.map((member) => (
            <div
              key={member.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: 'var(--bg-header)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={member.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(member.username)}`}
                    alt={member.username}
                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  {member.isOnline ? (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#00a884',
                        border: '2px solid var(--bg-header)',
                      }}
                      title="Online"
                    />
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#667781',
                        border: '2px solid var(--bg-header)',
                      }}
                      title="Offline"
                    />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {member.username}
                    {member.role === 'Group Admin' && (
                      <span style={{ fontSize: '9px', background: 'rgba(0,168,132,0.15)', color: 'var(--accent-green)', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {member.isOnline ? 'Active Now' : 'Offline'}
                  </div>
                </div>
              </div>

              {!member.isSelf && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => handleStartDirectChat(member)}
                    title="Direct Message"
                    style={{
                      background: 'var(--bg-sidebar)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '6px',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <MessageSquare size={13} />
                  </button>

                  <button
                    onClick={() => handleStartDirectCall(member)}
                    title="Direct Voice Call"
                    style={{
                      background: 'rgba(0,168,132,0.12)',
                      border: '1px solid var(--accent-green)',
                      color: 'var(--accent-green)',
                      borderRadius: '6px',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Phone size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
