import React, { useState } from 'react';
import { Search } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys & Reactions',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '📁'],
  },
  {
    name: 'Hands & Gestures',
    emojis: ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤙', '💪', '🖕', '✍️', '🙏', '🤝', '👏', '🙌', '👐', '🤲'],
  },
  {
    name: 'Hearts & Emotions',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '🔥', '💥', '✨', '🌟', '💫', '⚡', '🎉', '🎊', '🎈'],
  },
  {
    name: 'Objects & Symbols',
    emojis: ['🚀', '💻', '📱', '⌨️', '🎧', '🎯', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾', '🎁', '🎂', '🍕', '🍔', '🍟', '🍦', '☕', '🍺', '🍷', '💡', '💰', '📌', '🔔', '💬', '💯'],
  },
];

export default function EmojiPicker({ onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const filteredEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter(() => true) // Display full list filter
    : EMOJI_CATEGORIES[activeTab].emojis;

  return (
    <div
      className="animate-fade-in-up"
      style={{
        padding: '12px',
        borderRadius: '14px',
        background: 'var(--bg-sidebar)',
        border: '1px solid var(--border-color)',
        width: '310px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Search Input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '6px 10px',
          gap: '6px',
        }}
      >
        <Search size={14} color="var(--text-secondary)" />
        <input
          type="text"
          placeholder="Search emojis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontSize: '12.5px',
            outline: 'none',
            width: '100%',
          }}
        />
      </div>

      {/* Category Tabs */}
      {!search.trim() && (
        <div
          style={{
            display: 'flex',
            gap: '4px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '6px',
          }}
        >
          {EMOJI_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              onClick={() => setActiveTab(idx)}
              style={{
                flex: 1,
                background: activeTab === idx ? 'var(--bg-hover)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 2px',
                fontSize: '15px',
                cursor: 'pointer',
                opacity: activeTab === idx ? 1 : 0.6,
              }}
              title={cat.name}
            >
              {cat.emojis[0]}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '4px',
          maxHeight: '180px',
          overflowY: 'auto',
          paddingRight: '2px',
        }}
      >
        {filteredEmojis.map((emoji, i) => (
          <button
            key={i}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              padding: '6px',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.1s ease, background 0.1s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.transform = 'scale(1.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Keyboard Shortcut Hint */}
      <div
        style={{
          fontSize: '10.5px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '6px',
          opacity: 0.8,
        }}
      >
        Keyboard shortcut: Press <strong>Win + .</strong> or <strong>Cmd + Ctrl + Space</strong> for all keyboard emojis!
      </div>
    </div>
  );
}
