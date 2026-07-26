import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { X, Activity, Clock, MessageSquare, Zap, RotateCcw, Users } from 'lucide-react';

export default function ChatAnalyticsModal({ onClose }) {
  const { profile } = useAuth();
  const { users } = useChat();

  // ── Stats from backend ──────────────────────────────────────────
  const [stats, setStats] = useState({
    sent: 0,
    received: 0,
    activeContacts: 0,
    avgResponseSecs: null,
    weeklyData: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => ({ day: d, count: 0 })),
    dmPercent: 0,
    mediaPercent: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Screen time from backend ────────────────────────────────────
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [timeLoading, setTimeLoading] = useState(true);
  const accumulatedRef = useRef(0);
  const syncTimerRef = useRef(null);

  // ── Tooltip state ───────────────────────────────────────────────
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Load screen time from Supabase on mount
  useEffect(() => {
    if (!profile?.id || !supabase) { setTimeLoading(false); return; }

    async function loadScreenTime() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
          .from('user_daily_usage')
          .select('screen_time_seconds')
          .eq('user_id', profile.id)
          .eq('date', today)
          .maybeSingle();

        const saved = data?.screen_time_seconds ?? 0;
        setSessionSeconds(saved);
        accumulatedRef.current = saved;
      } catch {
        // table may not exist yet — start from 0
      } finally {
        setTimeLoading(false);
      }
    }
    loadScreenTime();
  }, [profile?.id]);

  // Live timer
  useEffect(() => {
    const tick = setInterval(() => {
      accumulatedRef.current += 1;
      setSessionSeconds((p) => p + 1);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // Sync screen time to Supabase every 30 seconds + on unmount
  useEffect(() => {
    if (!profile?.id || !supabase) return;

    const syncToBackend = async () => {
      if (!isSupabaseConfigured) return;
      const today = new Date().toISOString().split('T')[0];
      try {
        await supabase.from('user_daily_usage').upsert(
          {
            user_id: profile.id,
            date: today,
            screen_time_seconds: accumulatedRef.current,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,date' }
        );
      } catch {
        // silent
      }
    };

    syncTimerRef.current = setInterval(syncToBackend, 30000);
    return () => {
      clearInterval(syncTimerRef.current);
      syncToBackend(); // save on close
    };
  }, [profile?.id]);

  // Fetch all analytics from backend
  const fetchMetrics = useCallback(async () => {
    if (!profile?.id || !supabase || !isSupabaseConfigured) {
      setStatsLoading(false);
      return;
    }

    try {
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, created_at, content')
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: true });

      if (!msgs) { setStatsLoading(false); return; }

      const sentMsgs = msgs.filter((m) => m.sender_id === profile.id);
      const recvMsgs = msgs.filter((m) => m.receiver_id === profile.id);
      const sentCount = sentMsgs.length;
      const recvCount = recvMsgs.length;

      // Unique conversation partners
      const partnerIds = new Set(
        msgs.map((m) => (m.sender_id === profile.id ? m.receiver_id : m.sender_id))
      );

      // Weekly data — last 7 days in order
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const now = new Date();
      const orderedDays = [];
      const daysMap = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const name = dayNames[d.getDay()];
        const key = d.toISOString().split('T')[0];
        daysMap[key] = { day: name, count: 0 };
        orderedDays.push(key);
      }
      msgs.forEach((m) => {
        const key = new Date(m.created_at).toISOString().split('T')[0];
        if (daysMap[key]) daysMap[key].count += 1;
      });
      const weeklyData = orderedDays.map((k) => daysMap[k]);

      // Average response time (received → next reply to same person, capped at 1h)
      const responseTimes = [];
      recvMsgs.forEach((recv) => {
        const recvTime = new Date(recv.created_at).getTime();
        const nextReply = sentMsgs.find(
          (s) => s.receiver_id === recv.sender_id && new Date(s.created_at).getTime() > recvTime
        );
        if (nextReply) {
          const diff = (new Date(nextReply.created_at).getTime() - recvTime) / 1000;
          if (diff < 3600) responseTimes.push(diff);
        }
      });
      const avgResponseSecs =
        responseTimes.length > 0
          ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          : null;

      // Usage distribution — detect media by URL pattern in content
      const mediaMsgCount = sentMsgs.filter(
        (m) => m.content && (m.content.startsWith('http') || m.content.includes('/storage/'))
      ).length;
      const total = Math.max(sentCount, 1);
      const mediaPercent = Math.round((mediaMsgCount / total) * 100);
      const dmPercent = 100 - mediaPercent;

      setStats({
        sent: sentCount,
        received: recvCount,
        activeContacts: partnerIds.size,
        avgResponseSecs,
        weeklyData,
        dmPercent,
        mediaPercent,
      });

      // Update last_seen silently
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', profile.id);
    } catch {
      // silent
    } finally {
      setStatsLoading(false);
    }
  }, [profile?.id, users.length]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // ── Helpers ─────────────────────────────────────────────────────
  const formatSeconds = (secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const formatResponseTime = (secs) => {
    if (secs === null) return '—';
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${Math.round(secs / 60)}m`;
    return `${(secs / 3600).toFixed(1)}h`;
  };

  const handleResetSession = async () => {
    setSessionSeconds(0);
    accumulatedRef.current = 0;
    if (profile?.id && supabase) {
      const today = new Date().toISOString().split('T')[0];
      try {
        await supabase.from('user_daily_usage').upsert(
          { user_id: profile.id, date: today, screen_time_seconds: 0, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,date' }
        );
      } catch { /* silent */ }
    }
  };

  // ── SVG chart math ───────────────────────────────────────────────
  const maxCount = Math.max(...stats.weeklyData.map((d) => d.count), 1);
  const svgWidth = 520;
  const svgHeight = 150;
  const padTop = 20;
  const padBottom = 30;
  const points = stats.weeklyData.map((d, index) => {
    const x = (index / (stats.weeklyData.length - 1)) * (svgWidth - 40) + 20;
    const y = svgHeight - padBottom - (d.count / maxCount) * (svgHeight - padTop - padBottom);
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

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 20000 }}>
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
          style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', color: 'var(--icon-default)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0, 168, 132, 0.14)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Screen Time &amp; Analytics
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>App usage metrics</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Screen Time Card */}
          <div style={{ background: 'var(--bg-header)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-green)', letterSpacing: '0.8px', marginBottom: '4px' }}>
                Today's Screen Time
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                {timeLoading ? '——' : formatSeconds(sessionSeconds)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Active session for {profile?.username || 'User'}
              </div>
            </div>
            <button
              onClick={handleResetSession}
              title="Reset Session Timer"
              style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '7px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
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
                {statsLoading ? '…' : stats.sent}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Messages</div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-header)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <MessageSquare size={13} color="#53bdeb" /> Received
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {statsLoading ? '…' : stats.received}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Messages</div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-header)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Users size={13} color="#eab308" /> Contacts
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {statsLoading ? '…' : stats.activeContacts}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Active</div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-header)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Zap size={13} color="#a855f7" /> Response
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {statsLoading ? '…' : formatResponseTime(stats.avgResponseSecs)}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>Average</div>
            </div>
          </div>

          {/* Weekly Chart */}
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

            <div style={{ position: 'relative', width: '100%', height: '160px' }}>
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                {/* Stroke Line */}
                <path d={pathD} fill="none" stroke="var(--accent-green)" strokeWidth="3" strokeLinecap="round" />

                {/* Interactive Points */}
                {points.map((pt, idx) => (
                  <g key={idx} style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredPoint(pt)} onMouseLeave={() => setHoveredPoint(null)}>
                    <circle cx={pt.x} cy={pt.y} r="5" fill="var(--bg-sidebar)" stroke="var(--accent-green)" strokeWidth="2" />
                  </g>
                ))}

                {/* Day Labels inside SVG */}
                {points.map((pt, idx) => (
                  <text key={`lbl-${idx}`} x={pt.x} y={svgHeight - 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-secondary)">
                    {pt.day}
                  </text>
                ))}
              </svg>

              {/* Tooltip */}
              {hoveredPoint && (
                <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, pointerEvents: 'none' }}>
                  {hoveredPoint.day}: {hoveredPoint.count} msgs
                </div>
              )}
            </div>
          </div>

          {/* Usage Distribution — from real data */}
          <div style={{ background: 'var(--bg-header)', borderRadius: '12px', padding: '14px 16px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)', marginBottom: '10px' }}>
              Usage Distribution
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  <span>Direct Messaging</span>
                  <span>{statsLoading ? '…' : `${stats.dmPercent}%`}</span>
                </div>
                <div style={{ height: '5px', background: 'var(--bg-sidebar)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: statsLoading ? '0%' : `${stats.dmPercent}%`, background: 'var(--accent-green)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  <span>Voice &amp; Media</span>
                  <span>{statsLoading ? '…' : `${stats.mediaPercent}%`}</span>
                </div>
                <div style={{ height: '5px', background: 'var(--bg-sidebar)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: statsLoading ? '0%' : `${stats.mediaPercent}%`, background: '#53bdeb', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
