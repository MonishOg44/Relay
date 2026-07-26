import React, { useState, useEffect, useMemo } from 'react';
import { X, HardDrive, FileText, Download, Image as ImageIcon, Video } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function SharedItemsModal({ isOpen, onClose, user }) {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!isOpen || !user || !profile) return;

    let isMounted = true;
    const fetchSharedItems = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id, content, created_at, sender_id')
          .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${profile.id})`)
          .or('content.like.[FILE]%,content.like.[MEDIA]%')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (isMounted) {
          setItems(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch shared items:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSharedItems();

    return () => {
      isMounted = false;
    };
  }, [isOpen, user, profile]);

  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 1000 }} onClick={onClose}>
      <div
        className="modal-card animate-fade-in-up"
        style={{
          maxWidth: '440px',
          padding: '0',
          overflow: 'hidden',
          borderRadius: '16px',
          background: isDark ? 'var(--bg-header)' : '#ffffff',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          height: '500px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-sidebar)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={18} color="var(--accent-green)" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Shared Items
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Loading shared items...
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              No files or media have been shared with {user.username} yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(() => {
                const flattenedItems = [];
                items.forEach(msg => {
                  if (msg.content.startsWith('[FILE] ')) {
                    flattenedItems.push({
                      id: msg.id,
                      name: msg.content.replace('[FILE] ', '').trim(),
                      type: 'mock_file',
                      created_at: msg.created_at,
                      sender_id: msg.sender_id,
                      url: null
                    });
                  } else if (msg.content.startsWith('[MEDIA] ')) {
                    try {
                      const mediaArr = JSON.parse(msg.content.replace('[MEDIA] ', '').trim());
                      mediaArr.forEach((media, idx) => {
                        flattenedItems.push({
                          id: `${msg.id}-${idx}`,
                          name: media.name || 'Shared Media',
                          url: media.url,
                          type: media.type,
                          created_at: msg.created_at,
                          sender_id: msg.sender_id
                        });
                      });
                    } catch (err) {}
                  }
                });

                if (flattenedItems.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      No valid files found.
                    </div>
                  );
                }

                return flattenedItems.map((item) => {
                  const isSentByMe = item.sender_id === profile.id;
                  
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'var(--bg-input)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0, 168, 132, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {item.type === 'image' && item.url ? (
                          <img src={item.url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : item.type === 'image' ? (
                          <ImageIcon size={20} color="var(--accent-green)" />
                        ) : item.type === 'video' ? (
                          <Video size={20} color="var(--accent-green)" />
                        ) : (
                          <FileText size={20} color="var(--accent-green)" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {isSentByMe ? 'Sent by you' : `Sent by ${user.username}`} • {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <a
                        href={item.url || '#'}
                        onClick={(e) => {
                          if (item.type === 'mock_file') {
                            e.preventDefault();
                            // Create a dummy download for the mock file
                            const element = document.createElement('a');
                            const file = new Blob([`Mock content for ${item.name}`], { type: 'text/plain' });
                            element.href = URL.createObjectURL(file);
                            element.download = item.name;
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                          }
                        }}
                        download={item.url ? item.name : undefined}
                        target={item.url ? "_blank" : undefined}
                        rel={item.url ? "noopener noreferrer" : undefined}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          padding: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          transition: 'background 0.2s ease',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        title="Download"
                      >
                        <Download size={16} />
                      </a>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
