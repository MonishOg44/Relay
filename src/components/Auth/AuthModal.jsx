import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, LogIn, UserPlus, Database, ArrowRight, Sparkles } from 'lucide-react';
import { getMockProfiles } from '../../lib/mockSupabase';
import { Link001, Link002 } from '../ui/skiper-ui/skiper40';

export default function AuthModal({ onOpenConfig }) {
  const { login, signup, isMockMode, switchDemoUser } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const mockProfiles = isMockMode ? getMockProfiles() : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isSignUp) {
        await signup(email, password, username);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 11, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px'
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          maxWidth: '460px',
          width: '100%',
          borderRadius: '24px',
          padding: '36px',
          position: 'relative'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
              marginBottom: '16px'
            }}
          >
            <MessageSquare size={30} color="#fff" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>
            {isSignUp ? 'Create 3D Account' : 'Welcome to Relay'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
            {isMockMode ? '⚡ Interactive Demo Mode (Supabase Ready)' : '🟢 Supabase Real-Time Messenger'}
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '13px',
              marginBottom: '20px',
              textAlign: 'center'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isSignUp && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                USERNAME
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. alex_cyber"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  color: 'var(--text-main)',
                  outline: 'none'
                }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@relay3d.app"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              PASSWORD
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            className="glow-btn"
            disabled={submitting}
            style={{
              marginTop: '8px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
            {submitting ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        {isMockMode && mockProfiles.length > 0 && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600 }}>
              QUICK DEMO USERS (CLICK TO SWITCH):
            </div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {mockProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => switchDemoUser(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <img src={p.avatar_url} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                  {p.username}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={onOpenConfig}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--glass-border)',
              borderRadius: '20px',
              padding: '6px 14px',
              color: 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <Database size={14} color="#10b981" />
            {isMockMode ? 'Connect Supabase Keys' : 'Supabase Config'}
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
