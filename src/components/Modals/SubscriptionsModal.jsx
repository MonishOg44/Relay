import React, { useState, useEffect } from 'react';
import { Lock, X, Bell, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

export default function SubscriptionsModal({ onClose }) {
  const { profile } = useAuth();
  const [notified, setNotified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkWaitlist() {
      if (!profile) return;
      try {
        const { data, error } = await supabase
          .from('waitlist')
          .select('id')
          .eq('user_id', profile.id)
          .eq('feature', 'premium_subscriptions')
          .single();
        
        if (data) {
          setNotified(true);
        }
      } catch (err) {
        // Ignored
      } finally {
        setLoading(false);
      }
    }
    checkWaitlist();
  }, [profile]);

  const handleNotifyClick = async () => {
    if (!profile || notified) return;
    
    // Optimistic UI update
    setNotified(true);
    
    try {
      const { error } = await supabase
        .from('waitlist')
        .insert({ user_id: profile.id, feature: 'premium_subscriptions' });
        
      if (error) {
        console.error('Error joining waitlist:', error);
        setNotified(false);
      }
    } catch (err) {
      console.error(err);
      setNotified(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--overlay-bg, rgba(0,0,0,0.75))',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 9999,
        padding: '16px',
        boxSizing: 'border-box',
      }}
      className="animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '36px 28px',
          background: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          borderRadius: '20px',
          position: 'relative',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          boxSizing: 'border-box',
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

        {/* Lock Icon Badge */}
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '22px',
            background: 'rgba(245, 158, 11, 0.14)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <Lock size={34} />
        </div>

        {/* Title */}
        <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 10px', color: 'var(--text-primary)', lineHeight: '1.2' }}>
          Coming Soon
        </h3>

        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '0 auto 28px', maxWidth: '340px', lineHeight: '1.6' }}>
          Subscriptions and premium tiers are currently locked. Stay tuned for future updates!
        </p>

        {/* Action Button */}
        <button
          onClick={handleNotifyClick}
          disabled={notified || loading}
          style={{
            width: '100%',
            background: notified ? 'rgba(0,168,132,0.14)' : 'var(--accent-green)',
            color: notified ? 'var(--accent-green)' : 'var(--accent-contrast-text, #ffffff)',
            border: notified ? '1px solid var(--accent-green)' : 'none',
            borderRadius: '12px',
            padding: '13px',
            fontSize: '13.5px',
            fontWeight: 800,
            cursor: notified ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          {notified ? (
            <>
              <CheckCircle2 size={18} /> You're on the list!
            </>
          ) : (
            <>
              <Bell size={18} /> Get Notified
            </>
          )}
        </button>
      </div>
    </div>
  );
}
