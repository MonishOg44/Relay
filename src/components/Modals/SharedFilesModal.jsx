import React, { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  X,
  Image,
  FileText,
  Music,
  Film,
  Download,
  Search,
  Clock,
  Trash2,
  AlertCircle,
  FileUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

export default function SharedFilesModal({ onClose }) {
  const { profile } = useAuth();
  const { activeUser, users } = useChat();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [fileList, setFileList] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState(activeUser?.id || (users[0]?.id || ''));
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Docs');
  const [uploading, setUploading] = useState(false);

  // 15 Days in milliseconds
  const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

  // Fetch files from Supabase Backend & Auto-Delete Expired Files (>15 Days)
  const fetchBackendFiles = useCallback(async () => {
    if (!profile || !supabase || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (messages) {
        const now = Date.now();
        const validFiles = [];
        const expiredIds = [];

        messages.forEach((m) => {
          const isFile =
            m.content?.startsWith('[FILE]') ||
            m.content?.includes('.pdf') ||
            m.content?.includes('.png') ||
            m.content?.includes('.jpg') ||
            m.content?.includes('.mp4') ||
            m.content?.includes('.zip') ||
            m.content?.includes('.doc');

          if (isFile) {
            const createdAtMs = new Date(m.created_at).getTime();
            const ageMs = now - createdAtMs;

            if (ageMs > FIFTEEN_DAYS_MS) {
              expiredIds.push(m.id);
            } else {
              const daysRemaining = Math.max(0, Math.ceil((FIFTEEN_DAYS_MS - ageMs) / (1000 * 60 * 60 * 24)));
              const rawName = m.content.replace('[FILE]', '').trim();
              const category =
                rawName.includes('.png') || rawName.includes('.jpg')
                  ? 'Images'
                  : rawName.includes('.mp4') || rawName.includes('.mkv')
                  ? 'Media'
                  : rawName.includes('.mp3') || rawName.includes('.m4a')
                  ? 'Audio'
                  : 'Docs';

              validFiles.push({
                id: m.id,
                name: rawName,
                category,
                senderId: m.sender_id,
                isSender: m.sender_id === profile.id,
                size: '2.4 MB',
                created_at: m.created_at,
                daysRemaining,
              });
            }
          }
        });

        // Silently purge expired files older than 15 days
        if (expiredIds.length > 0) {
          await supabase.from('messages').delete().in('id', expiredIds);
        }

        setFileList(validFiles);
      }
    } catch (err) {
      console.warn('Files fetch notice:', err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchBackendFiles();
  }, [fetchBackendFiles]);

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!uploadFileName.trim() || !selectedRecipientId || !profile) return;

    try {
      setUploading(true);
      const formattedContent = `[FILE] ${uploadFileName.trim()}`;

      const { error } = await supabase.from('messages').insert({
        sender_id: profile.id,
        receiver_id: selectedRecipientId,
        content: formattedContent,
        is_read: false,
      });

      if (error) throw error;

      setUploadFileName('');
      setShowUploadModal(false);
      fetchBackendFiles();
    } catch (err) {
      alert('Error uploading file: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const getIcon = (cat) => {
    switch (cat) {
      case 'Images': return <Image size={18} color="var(--accent-green)" />;
      case 'Docs': return <FileText size={18} color="var(--accent-green)" />;
      case 'Audio': return <Music size={18} color="var(--accent-green)" />;
      case 'Media': return <Film size={18} color="var(--accent-green)" />;
      default: return <FileText size={18} color="var(--accent-green)" />;
    }
  };

  const filtered = fileList.filter((f) => {
    const matchesCat = activeFilter === 'All' || f.category === activeFilter;
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 3500 }}>
      <div
        className="modal-card animate-fade-in-up"
        style={{
          maxWidth: '660px',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingRight: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(0, 168, 132, 0.14)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Folder size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Shared Documents & Media
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Files sent/received (Auto-purges after 15 days)
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
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
            <FileUp size={15} /> Send File
          </button>
        </div>

        {/* Filter Pills & Search */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {['All', 'Docs', 'Images', 'Audio', 'Media'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '14px',
                  border: '1px solid',
                  borderColor: activeFilter === cat ? 'var(--accent-green)' : 'var(--border-color)',
                  background: activeFilter === cat ? 'var(--accent-green)' : 'var(--bg-header)',
                  color: activeFilter === cat ? 'var(--accent-contrast-text)' : 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '180px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-header)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px 10px 6px 30px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* 15 Day Auto Purge Warning Banner */}
        <div
          style={{
            background: 'var(--bg-header)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            marginBottom: '16px',
          }}
        >
          <Clock size={15} color="var(--accent-green)" />
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>15-Day Auto Delete:</strong> Files automatically expire and purge permanently 15 days after being sent or received.
          </span>
        </div>

        {/* File Cards Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Syncing backend files...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px', background: 'var(--bg-header)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <Folder size={22} color="var(--text-secondary)" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>No files found</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Files sent in chat will automatically appear here
              </div>
            </div>
          ) : (
            filtered.map((file) => (
              <div
                key={file.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'var(--bg-header)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div style={{ padding: '10px', borderRadius: '10px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)' }}>
                    {getIcon(file.category)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <span style={{ whiteSpace: 'nowrap' }}>{file.isSender ? 'Sent by you' : 'Received'}</span>
                      <span style={{ color: 'var(--border-color)' }}>•</span>
                      <span style={{ whiteSpace: 'nowrap' }}>{file.size}</span>
                      <span style={{ color: 'var(--border-color)' }}>•</span>
                      <span style={{ color: 'var(--accent-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                        <Clock size={11} /> Purges in {file.daysRemaining}d
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href={`#download-${file.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Downloading ${file.name}...`);
                  }}
                  style={{
                    background: 'var(--bg-sidebar)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none',
                  }}
                >
                  <Download size={13} /> Download
                </a>
              </div>
            ))
          )}
        </div>

        {/* Send File Form Overlay */}
        {showUploadModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 3700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <form
              onSubmit={handleUploadFile}
              style={{
                background: 'var(--bg-sidebar)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '20px',
                width: '360px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                  Send Document / File
                </div>
                <button type="button" onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Recipient</label>
                <select
                  value={selectedRecipientId}
                  onChange={(e) => setSelectedRecipientId(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-header)', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>File Name / Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Contract_Agreement.pdf"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-header)', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }}
                />
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-header)', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-color)' }}>
                <Clock size={13} color="var(--accent-green)" /> Saved to backend & purges automatically in 15 days.
              </div>

              <button
                type="submit"
                disabled={uploading}
                style={{
                  background: 'var(--accent-green)',
                  color: 'var(--accent-contrast-text)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '4px',
                }}
              >
                {uploading ? 'Sending File...' : 'Send File to Contact'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
