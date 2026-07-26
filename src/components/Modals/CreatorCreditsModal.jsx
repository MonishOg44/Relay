import React from 'react';
import { Award, X, Sparkles, Code2, Heart, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';

export default function CreatorCreditsModal({ onClose }) {
  const techStack = [
    { name: 'React 18', desc: 'UI & Component Architecture' },
    { name: 'Supabase DB', desc: 'Realtime Auth & PostgreSQL' },
    { name: 'WebRTC P2P', desc: 'HD Voice Calls Engine' },
    { name: 'GSAP', desc: 'Smooth Staggered Menu Animations' },
    { name: 'Lucide Icons', desc: 'Clean Modern Iconset' },
  ];

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100 }}>
      <div className="modal-card animate-fade-in-up" style={{ maxWidth: '540px', width: '90%' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none', color: 'var(--icon-default)', cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
            <Award size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Creator & Platform Credits</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Crafted with passion for seamless communication
            </p>
          </div>
        </div>

        {/* Creator Info Box */}
        <div style={{ background: 'linear-gradient(135deg, rgba(0, 168, 132, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)', borderRadius: '12px', padding: '18px', border: '1px solid rgba(0, 168, 132, 0.3)', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#00a884" />
              <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>RELAY MESSENGER v2.4.0</span>
            </div>
            <span style={{ fontSize: '11px', background: '#00a884', color: '#fff', padding: '3px 8px', borderRadius: '12px', fontWeight: 700 }}>
              PRO RELEASE
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Relay is an ultra-fast, end-to-end encrypted messaging & voice call suite built for real-time collaboration. Designed & developed with modern web technology standards.
          </p>
        </div>

        {/* Tech Stack List */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Code2 size={16} color="#00a884" /> Powered By
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {techStack.map((tech, idx) => (
              <div key={idx} style={{ background: 'var(--bg-header)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>{tech.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{tech.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          Made with <Heart size={14} color="#ff4b4b" fill="#ff4b4b" /> for Relay Users Worldwide
        </div>
      </div>
    </div>
  );
}
