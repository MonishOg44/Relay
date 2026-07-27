import React, { useState } from 'react';
import { Users, X, Plus, Shield, MessageSquare, UserCheck, Phone, Check, Trash2, LogOut } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useVoiceCall } from '../../context/VoiceCallContext';
import ConfirmModal from '../ui/ConfirmModal';

export default function GroupsModal({ onClose, initialCreate = false }) {
  const { groupsList = [], createGroup, setActiveUser, users, deleteGroup, leaveGroup } = useChat();
  const { startCall } = useVoiceCall();

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    type: 'danger',
    onConfirm: () => {},
  });

  const [showCreate, setShowCreate] = useState(initialCreate);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  const toggleMemberSelection = (userId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const addedUsers = users.filter((u) => selectedMemberIds.includes(u.id));
    const addedNames = addedUsers.map((u) => u.username);
    const addedNotice = addedNames.length > 0 ? addedNames.join(', ') : 'members';

    const newGroup = createGroup({
      name: newGroupName,
      desc: newGroupDesc,
      memberIds: selectedMemberIds,
      initialNotice: `You created group "${newGroupName.trim()}" and added ${addedNotice} to this channel`,
    });

    setNewGroupName('');
    setNewGroupDesc('');
    setSelectedMemberIds([]);
    setShowCreate(false);
    onClose();
  };

  const handleOpenGroupChat = (group) => {
    setActiveUser(group);
    onClose();
  };

  const handleStartGroupCall = (group) => {
    setActiveUser(group);
    if (startCall) {
      startCall(group);
    }
    onClose();
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 3500 }}>
      <div
        className="modal-card animate-fade-in-up"
        style={{
          maxWidth: '620px',
          width: '92%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          background: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          borderRadius: '16px',
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

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', paddingRight: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(0, 168, 132, 0.14)',
                color: 'var(--accent-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Users size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '16.5px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Group Conversations &amp; Channels
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Join or create team channels and group voice calls
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreate(!showCreate)}
            style={{
              background: 'var(--accent-green)',
              color: 'var(--accent-contrast-text)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
            }}
          >
            <Plus size={16} /> Create Group
          </button>
        </div>

        {/* Create Group Form Overlay */}
        {showCreate && (
          <form
            onSubmit={handleCreateGroup}
            style={{
              background: 'var(--bg-header)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
              Create New Team Group
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Group Name</label>
              <input
                type="text"
                placeholder="e.g. Relay Product Engineering"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-sidebar)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  outline: 'none',
                }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Description</label>
              <input
                type="text"
                placeholder="Topic or channel purpose..."
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-sidebar)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Select Members Checklist */}
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Select Members to Add</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                {users.map((u) => {
                  const isSelected = selectedMemberIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleMemberSelection(u.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--accent-green)' : 'var(--border-color)',
                        background: isSelected ? 'rgba(0,168,132,0.15)' : 'var(--bg-sidebar)',
                        color: isSelected ? 'var(--accent-green)' : 'var(--text-secondary)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isSelected && <Check size={12} />}
                      {u.username}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  background: 'var(--accent-green)',
                  border: 'none',
                  color: 'var(--accent-contrast-text)',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Launch Group Chat
              </button>
            </div>
          </form>
        )}

        {/* Groups Feed List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
          {groupsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              No active group chats found.
            </div>
          ) : (
            groupsList.map((group) => (
              <div
                key={group.id}
                style={{
                  background: 'var(--bg-header)',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <img
                    src={group.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(group.username)}`}
                    alt={group.username}
                    style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {group.username}
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,168,132,0.12)', color: 'var(--accent-green)', fontWeight: 700 }}>
                        Channel
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {group.desc}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.8 }}>
                      {group.email || `${group.membersCount || 1} members`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => handleStartGroupCall(group)}
                    title="Start Group Voice Call"
                    style={{
                      background: 'rgba(0,168,132,0.12)',
                      border: '1px solid var(--accent-green)',
                      color: 'var(--accent-green)',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Phone size={13} /> Call
                  </button>

                  <button
                    onClick={() => handleOpenGroupChat(group)}
                    style={{
                      background: 'var(--accent-green)',
                      border: 'none',
                      color: 'var(--accent-contrast-text)',
                      borderRadius: '8px',
                      padding: '7px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Open
                  </button>

                  <button
                    onClick={() => {
                      setConfirmConfig({
                        isOpen: true,
                        title: 'Leave Group Channel',
                        message: `Are you sure you want to leave "${group.username}"?`,
                        confirmText: 'Leave Group',
                        type: 'warning',
                        onConfirm: () => {
                          leaveGroup(group.id);
                          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
                        },
                      });
                    }}
                    title="Leave Group"
                    style={{
                      background: 'var(--bg-sidebar)',
                      border: '1px solid var(--border-color)',
                      color: '#f59e0b',
                      borderRadius: '8px',
                      padding: '7px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LogOut size={14} />
                  </button>

                  <button
                    onClick={() => {
                      setConfirmConfig({
                        isOpen: true,
                        title: 'Delete Group Channel',
                        message: `Are you sure you want to permanently delete "${group.username}"?`,
                        confirmText: 'Delete Channel',
                        type: 'danger',
                        onConfirm: () => {
                          deleteGroup(group.id);
                          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
                        },
                      });
                    }}
                    title="Delete Group Channel"
                    style={{
                      background: 'var(--bg-sidebar)',
                      border: '1px solid var(--border-color)',
                      color: '#ef4444',
                      borderRadius: '8px',
                      padding: '7px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          type={confirmConfig.type}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>
    </div>
  );
}
