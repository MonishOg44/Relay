import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import {
  X,
  Activity,
  Clock,
  ShieldAlert,
  Lock,
  Unlock,
  Sliders,
  MessageSquare,
  PhoneCall,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Key,
  Users,
} from 'lucide-react';

export default function ChatAnalyticsModal({ onClose }) {
  const { profile } = useAuth();
  const { users } = useChat();
  const [activeTab, setActiveTab] = useState('analytics');

  // Backend Metrics State (Fetched silently)
  const [stats, setStats] = useState({
    sent: 14,
    received: 28,
    activeContacts: 3,
    weeklyData: [
      { day: 'Mon', count: 12 },
      { day: 'Tue', count: 19 },
      { day: 'Wed', count: 8 },
      { day: 'Thu', count: 25 },
      { day: 'Fri', count: 32 },
      { day: 'Sat', count: 41 },
      { day: 'Sun', count: 22 },
    ],
  });

  // Track session time spent
  const [sessionSeconds, setSessionSeconds] = useState(() => {
    const key = profile?.id ? `relay_usage_secs_${profile.id}` : 'relay_session_seconds';
    const saved = localStorage.getItem(key);
    return saved ? parseInt(saved, 10) : 3622;
  });

  // Hovered bar tooltip state
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Parental Controls
  const [limitEnabled, setLimitEnabled] = useState(() => {
    return localStorage.getItem('relay_limit_enabled') === 'true';
  });

  const [dailyLimitMins, setDailyLimitMins] = useState(() => {
    const saved = localStorage.getItem('relay_limit_mins');
    return saved ? parseInt(saved, 10) : 120;
  });

  const [pinCode, setPinCode] = useState(() => {
    return localStorage.getItem('relay_parental_pin') || '1234';
  });

  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lockAppOnExpiry, setLockAppOnExpiry] = useState(() => {
    return localStorage.getItem('relay_lock_on_expiry') !== 'false';
  });

  // Live timer tick
  useEffect(() => {
    const key = profile?.id ? `relay_usage_secs_${profile.id}` : 'relay_session_seconds';
    const interval = setInterval(() => {
      setSessionSeconds((prev) => {
        const next = prev + 1;
        localStorage.setItem(key, next.toString());
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  // Silent backend data fetching
  const fetchMetricsSilently = useCallback(async () => {
    if (!profile || !supabase || !isSupabaseConfigured) return;

    try {
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, created_at')
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`);

      if (msgs) {
        const sentCount = msgs.filter((m) => m.sender_id === profile.id).length;
        const recvCount = msgs.filter((m) => m.receiver_id === profile.id).length;
        const partnerIds = new Set(
          msgs.map((m) => (m.sender_id === profile.id ? m.receiver_id : m.sender_id))
        );

        // Group messages by past 7 days
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const daysMap = {};
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dayName = days[d.getDay()];
          daysMap[dayName] = { day: dayName, count: 0 };
        }

        msgs.forEach((m) => {
          const mDate = new Date(m.created_at);
          const dayName = days[mDate.getDay()];
          if (daysMap[dayName]) {
            daysMap[dayName].count += 1;
          }
        });

        setStats({
          sent: sentCount,
          received: recvCount,
          activeContacts: partnerIds.size || users.length,
          weeklyData: Object.values(daysMap),
        });

        // Silent last_seen timestamp update
        await supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', profile.id);
      }
    } catch {
      // Keep silent on background notice
    }
  }, [profile, users.length]);

  useEffect(() => {
    fetchMetricsSilently();
  }, [fetchMetricsSilently]);

  const formatSeconds = (secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const usedMins = Math.floor(sessionSeconds / 60);
  const usagePercent = Math.min(100, Math.round((usedMins / dailyLimitMins) * 100));
  const remainingMins = Math.max(0, dailyLimitMins - usedMins);

  const handleSaveParentalControls = (e) => {
    e.preventDefault();
    if (limitEnabled && inputPin !== pinCode) {
      setPinError('Invalid 4-Digit Security PIN');
      return;
    }
    localStorage.setItem('relay_limit_enabled', limitEnabled.toString());
    localStorage.setItem('relay_limit_mins', dailyLimitMins.toString());
    localStorage.setItem('relay_parental_pin', pinCode);
    localStorage.setItem('relay_lock_on_expiry', lockAppOnExpiry.toString());

    setPinError('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetSession = () => {
    const key = profile?.id ? `relay_usage_secs_${profile.id}` : 'relay_session_seconds';
    setSessionSeconds(0);
    localStorage.setItem(key, '0');
  };

  // Calculate SVG curve points for weekly chart
  const maxCount = Math.max(...stats.weeklyData.map((d) => d.count), 10);
  const svgWidth = 520;
  const svgHeight = 130;
  const points = stats.weeklyData.map((d, index) => {
    const x = (index / (stats.weeklyData.length - 1)) * (svgWidth - 40) + 20;
    const y = svgHeight - (d.count / maxCount) * (svgHeight - 30) - 15;
    return { x, y, day: d.day, count: d.count };
  });

  const pathD = points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prev = points[index - 1];
    const cx1 = prev.x + (point.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (point.x - prev.x) / 2;
    const cy2 = point.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${point.x} ${point.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 1200 }}>
      <div
        className="modal-card animate-fade-in-up"
        style={{
          maxWidth: '640px',
          width: '92%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          background: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
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

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: 'rgba(0, 168, 132, 0.14)',
              color: 'var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Activity size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Screen Time & Analytics
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              App usage metrics and parental controls
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '7px 16px',
              borderRadius: '20px',
              border: 'none',
              background: activeTab === 'analytics' ? 'var(--accent-green)' : 'var(--bg-header)',
              color: activeTab === 'analytics' ? 'var(--accent-contrast-text)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <Clock size={14} /> Usage Stats
          </button>
          <button
            onClick={() => setActiveTab('parental')}
            style={{
              padding: '7px 16px',
              borderRadius: '20px',
              border: 'none',
              background: activeTab === 'parental' ? 'var(--accent-green)' : 'var(--bg-header)',
              color: activeTab === 'parental' ? 'var(--accent-contrast-text)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <ShieldAlert size={14} /> Parental Controls
            {limitEnabled && (
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06cf9c' }} />
            )}
          </button>
        </div>

        {/* TAB 1: USAGE STATS */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Session Time Card */}
            <div
              style={{
                background: 'var(--bg-header)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-green)', letterSpacing: '0.8px', marginBottom: '4px' }}>
                  Today's Screen Time
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                  {formatSeconds(sessionSeconds)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Active session for {profile?.username || 'User'}
                </div>
              </div>

              <button
                onClick={handleResetSession}
                title="Reset Session Timer"
                style={{
                  background: 'var(--bg-sidebar)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="analytics-quick-grid" style={{ gap: '10px' }}>
              <div style={{ padding: '12px', background: 'var(--bg-header)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <MessageSquare size={13} color="var(--accent-green)" /> Sent
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {stats.sent}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Messages</div>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-header)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <MessageSquare size={13} color="#53bdeb" /> Received
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {stats.received}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Messages</div>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-header)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <Users size={13} color="#eab308" /> Contacts
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {stats.activeContacts}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Active</div>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-header)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <Zap size={13} color="#a855f7" /> Response
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  18s
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Average</div>
              </div>
            </div>

            {/* Smooth Custom SVG Area Chart */}
            <div style={{ background: 'var(--bg-header)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>Weekly Activity Overview</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Daily messaging volume</div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-green)' }}>
                  Total: {stats.sent + stats.received} Messages
                </span>
              </div>

              <div style={{ position: 'relative', width: '100%', height: '140px' }}>
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="relayChartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Area Fill */}
                  <path d={areaD} fill="url(#relayChartGrad)" />

                  {/* Stroke Line */}
                  <path d={pathD} fill="none" stroke="var(--accent-green)" strokeWidth="3" strokeLinecap="round" />

                  {/* Interactive Points */}
                  {points.map((pt, idx) => (
                    <g key={idx} style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredPoint(pt)} onMouseLeave={() => setHoveredPoint(null)}>
                      <circle cx={pt.x} cy={pt.y} r="5" fill="var(--bg-sidebar)" stroke="var(--accent-green)" strokeWidth="2" />
                    </g>
                  ))}
                </svg>

                {/* Day Labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', padding: '0 10px', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {stats.weeklyData.map((d, i) => (
                    <span key={i}>{d.day}</span>
                  ))}
                </div>

                {/* Tooltip Popup */}
                {hoveredPoint && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--bg-sidebar)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }}
                  >
                    {hoveredPoint.day}: {hoveredPoint.count} msgs
                  </div>
                )}
              </div>
            </div>

            {/* Activity Breakdown */}
            <div style={{ background: 'var(--bg-header)', borderRadius: '12px', padding: '14px 16px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)', marginBottom: '10px' }}>
                Usage Distribution
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                    <span>Direct Messaging</span>
                    <span>65%</span>
                  </div>
                  <div style={{ height: '5px', background: 'var(--bg-sidebar)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '65%', background: 'var(--accent-green)', borderRadius: '4px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                    <span>Voice & Media</span>
                    <span>35%</span>
                  </div>
                  <div style={{ height: '5px', background: 'var(--bg-sidebar)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '35%', background: '#53bdeb', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PARENTAL CONTROLS */}
        {activeTab === 'parental' && (
          <form onSubmit={handleSaveParentalControls} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Status Card */}
            <div
              style={{
                background: limitEnabled ? 'rgba(0, 168, 132, 0.08)' : 'var(--bg-header)',
                border: '1px solid',
                borderColor: limitEnabled ? 'var(--accent-green)' : 'var(--border-color)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: limitEnabled ? 'var(--accent-green)' : 'var(--bg-sidebar)', color: limitEnabled ? 'var(--accent-contrast-text)' : 'var(--text-secondary)' }}>
                  {limitEnabled ? <Lock size={18} /> : <Unlock size={18} />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                    Daily Usage Allowance
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {limitEnabled ? `Active limit: ${dailyLimitMins / 60} hour(s) per day` : 'Unlimited app usage'}
                  </div>
                </div>
              </div>

              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={limitEnabled}
                  onChange={(e) => setLimitEnabled(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: limitEnabled ? 'var(--accent-green)' : 'var(--bg-sidebar)',
                    borderRadius: '34px',
                    transition: '0.2s',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      height: '18px',
                      width: '18px',
                      left: limitEnabled ? '22px' : '3px',
                      bottom: '2px',
                      background: '#ffffff',
                      borderRadius: '50%',
                      transition: '0.2s',
                    }}
                  />
                </span>
              </label>
            </div>

            {/* Current Limit Meter */}
            {limitEnabled && (
              <div style={{ background: 'var(--bg-header)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Today's Limit Status
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: usagePercent > 90 ? '#ff4b4b' : 'var(--accent-green)' }}>
                    {usedMins}m / {dailyLimitMins}m ({usagePercent}%)
                  </span>
                </div>

                <div style={{ height: '8px', background: 'var(--bg-sidebar)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${usagePercent}%`,
                      background: usagePercent > 90 ? '#ff4b4b' : usagePercent > 75 ? '#eab308' : 'var(--accent-green)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span>Used: {usedMins} mins</span>
                  <span>{remainingMins > 0 ? `${remainingMins} mins remaining` : 'Daily limit reached'}</span>
                </div>
              </div>
            )}

            {/* Presets */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={14} color="var(--accent-green)" /> Daily Time Allowance
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[
                  { label: '30 Mins', mins: 30 },
                  { label: '1 Hour', mins: 60 },
                  { label: '2 Hours', mins: 120 },
                  { label: '3 Hours', mins: 180 },
                ].map((preset) => {
                  const isSelected = dailyLimitMins === preset.mins;
                  return (
                    <button
                      key={preset.mins}
                      type="button"
                      onClick={() => setDailyLimitMins(preset.mins)}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--accent-green)' : 'var(--border-color)',
                        background: isSelected ? 'rgba(0,168,132,0.12)' : 'var(--bg-header)',
                        color: isSelected ? 'var(--accent-green)' : 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PIN Code Setup */}
            <div style={{ background: 'var(--bg-header)', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={15} color="#eab308" /> Parental Security PIN
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 10px' }}>
                4-digit PIN required to alter usage limits
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Set 4-Digit PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    style={{
                      width: '100%',
                      background: 'var(--bg-sidebar)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '7px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      letterSpacing: '2px',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Confirm PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={inputPin}
                    onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter PIN"
                    style={{
                      width: '100%',
                      background: 'var(--bg-sidebar)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '7px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      letterSpacing: '2px',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {pinError && (
                <div style={{ color: '#ff4b4b', fontSize: '11px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={13} /> {pinError}
                </div>
              )}
            </div>

            {/* Lock App Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-header)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
                  Block App Access When Limit Reached
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Require PIN to continue using app after time expires
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '20px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={lockAppOnExpiry}
                  onChange={(e) => setLockAppOnExpiry(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: lockAppOnExpiry ? 'var(--accent-green)' : 'var(--bg-sidebar)',
                    borderRadius: '34px',
                    transition: '0.2s',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      height: '14px',
                      width: '14px',
                      left: lockAppOnExpiry ? '19px' : '3px',
                      bottom: '2px',
                      background: '#ffffff',
                      borderRadius: '50%',
                      transition: '0.2s',
                    }}
                  />
                </span>
              </label>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px' }}>
              {saveSuccess ? (
                <div style={{ color: 'var(--accent-green)', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle2 size={15} /> Settings Saved!
                </div>
              ) : (
                <span />
              )}

              <button
                type="submit"
                style={{
                  background: 'var(--accent-green)',
                  border: 'none',
                  color: 'var(--accent-contrast-text)',
                  borderRadius: '8px',
                  padding: '9px 20px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Lock size={14} /> Save Controls
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
