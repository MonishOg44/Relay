import React, { useState, useEffect } from 'react';
import { Star, X, MessageSquare, Image, Link, FileText, Trash2, Plus, Search, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export default function FavouritesModal({ onClose }) {
  const { profile } = useAuth();
  const { users, setActiveUser } = useChat();

  // Lock background scroll whenever this modal is mounted (works even when opened from Sidebar)
  useEffect(() => {
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
    return () => {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    };
  }, []);

  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const storageKey = profile?.id ? `relay_favourites_${profile.id}` : 'relay_favourites';

  // Load and strictly DEDUPLICATE starred items
  const [favourites, setFavourites] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Deduplicate array by unique id
        const seen = new Set();
        const unique = [];
        parsed.forEach((item) => {
          if (item && item.id && !seen.has(String(item.id))) {
            seen.add(String(item.id));
            unique.push(item);
          }
        });
        return unique;
      } catch {
        // fallback
      }
    }
    return [];
  });

  // New Bookmark Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Messages');

  useEffect(() => {
    // Deduplicate before saving to localStorage
    const seen = new Set();
    const unique = [];
    favourites.forEach((item) => {
      if (item && item.id && !seen.has(String(item.id))) {
        seen.add(String(item.id));
        unique.push(item);
      }
    });
    localStorage.setItem(storageKey, JSON.stringify(unique));
  }, [favourites, storageKey]);

  const handleAddBookmark = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newId = `fav_${Date.now()}`;
    const item = {
      id: newId,
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      sender: profile?.username || 'You',
      dateStr: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    setFavourites((prev) => {
      const cleanPrev = prev.filter((f) => String(f.id) !== String(newId));
      return [item, ...cleanPrev];
    });

    setNewTitle('');
    setNewContent('');
    setShowAddModal(false);
  };

  const removeFavourite = (id) => {
    setFavourites((prev) => prev.filter((item) => String(item.id) !== String(id)));
    // Also remove from starred IDs in chat
    const starStorageKey = profile?.id ? `relay_starred_ids_${profile.id}` : 'relay_starred_ids';
    const saved = localStorage.getItem(starStorageKey);
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        const nextIds = ids.filter((sId) => String(sId) !== String(id));
        localStorage.setItem(starStorageKey, JSON.stringify(nextIds));
      } catch {
        // fallback
      }
    }
  };

  const handleOpenChatForBookmark = (item) => {
    if (item.contactId) {
      const contact = users.find((u) => u.id === item.contactId);
      if (contact) {
        setActiveUser(contact);
        onClose();
        return;
      }
    }
    if (users[0]) {
      setActiveUser(users[0]);
      onClose();
    }
  };

  const filtered = favourites.filter((item) => {
    const matchesCat = activeTab === 'All' || item.category === activeTab;
    const matchesSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Links': return <Link size={16} color="var(--accent-green)" />;
      case 'Files': return <FileText size={16} color="var(--accent-green)" />;
      default: return <MessageSquare size={16} color="var(--accent-green)" />;
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 20000 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px', paddingRight: '28px' }}>
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
              <Star size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '16.5px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Favourites &amp; Starred Bookmarks
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Your saved messages, critical links, and media
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
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
            <Plus size={15} /> Add Star
          </button>
        </div>

        {/* Filters & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '100%', paddingBottom: '2px', WebkitOverflowScrolling: 'touch' }}>
            {['All', 'Messages', 'Links', 'Files'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '14px',
                  border: '1px solid',
                  borderColor: activeTab === tab ? 'var(--accent-green)' : 'var(--border-color)',
                  background: activeTab === tab ? 'var(--accent-green)' : 'var(--bg-header)',
                  color: activeTab === tab ? 'var(--accent-contrast-text)' : 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '180px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search starred..."
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

        {/* Content List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px', background: 'var(--bg-header)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <Star size={22} color="var(--text-secondary)" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>No starred items found</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Hover over any chat message and click the ⭐ icon to star it
              </div>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-header)',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ padding: '4px', borderRadius: '6px', background: 'rgba(0,168,132,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getCategoryIcon(item.category)}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: '10px', background: 'rgba(0,168,132,0.12)', color: 'var(--accent-green)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, flexShrink: 0 }}>
                      {item.sender}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', wordBreak: 'break-word', lineHeight: '1.4' }}>
                    {item.content}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>Saved: {item.dateStr}</span>
                    <span>•</span>
                    <button
                      onClick={() => handleOpenChatForBookmark(item)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-green)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      Open Chat <ExternalLink size={12} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => removeFavourite(item.id)}
                  title="Remove from Favourites"
                  style={{
                    background: 'var(--bg-sidebar)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    borderRadius: '8px',
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add Bookmark Overlay Modal */}
        {showAddModal && (
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
              onSubmit={handleAddBookmark}
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
                  Add Starred Bookmark
                </div>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Bookmark Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Database Schema Notes"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-header)', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-header)', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }}
                >
                  <option value="Messages">Messages</option>
                  <option value="Links">Links</option>
                  <option value="Files">Files</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Content / URL / Notes</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Paste text snippet or link..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-header)', color: 'var(--text-primary)', outline: 'none', fontSize: '12px', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
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
                Save Starred Bookmark
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
