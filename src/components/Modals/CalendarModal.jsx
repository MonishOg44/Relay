import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  X,
  Plus,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trash2,
  PhoneCall,
  Users,
  Bell,
  CheckCircle2,
  Phone,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useVoiceCall } from '../../context/VoiceCallContext';

export default function CalendarModal({ onClose }) {
  const { profile } = useAuth();
  const { users, setActiveUser } = useChat();
  const { startCall } = useVoiceCall();

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const storageKey = profile?.id ? `relay_calendar_events_${profile.id}` : 'relay_calendar_events';

  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    const todayStr = new Date().toISOString().split('T')[0];
    return [
      {
        id: '1',
        dateStr: todayStr,
        title: 'Relay Voice Sync Call',
        time: '10:00 AM',
        duration: '30m',
        type: 'Call',
        host: 'Alex Vance',
        contactId: users[0]?.id || '',
      },
      {
        id: '2',
        dateStr: todayStr,
        title: 'Product Architecture Review',
        time: '02:30 PM',
        duration: '45m',
        type: 'Meeting',
        host: 'Sarah Chen',
        contactId: users[1]?.id || '',
      },
    ];
  });

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('11:00 AM');
  const [newType, setNewType] = useState('Call');
  const [newDuration, setNewDuration] = useState('30m');
  const [selectedContactId, setSelectedContactId] = useState(users[0]?.id || '');

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(events));
  }, [events, storageKey]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  const formatSelectedDateStr = (dayNum) => {
    const m = (currentMonth + 1).toString().padStart(2, '0');
    const d = dayNum.toString().padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  const selectedDateStr = formatSelectedDateStr(selectedDay);

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const contactObj = users.find((u) => u.id === selectedContactId);
    const newEv = {
      id: Date.now().toString(),
      dateStr: selectedDateStr,
      title: newTitle.trim(),
      time: newTime,
      duration: newDuration,
      type: newType,
      host: profile?.username || 'You',
      contactId: selectedContactId,
      contactName: contactObj ? contactObj.username : 'Contact',
    };

    setEvents((prev) => [...prev, newEv]);
    setNewTitle('');
    setShowAddModal(false);
  };

  const handleDeleteEvent = (id) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  const handleStartCallForEvent = (ev) => {
    const targetUser = users.find((u) => u.id === ev.contactId) || users[0];
    if (targetUser && startCall) {
      setActiveUser(targetUser);
      startCall(targetUser);
      onClose();
    } else {
      alert(`Initiating voice call for ${ev.title}...`);
    }
  };

  const dayEvents = events.filter((ev) => {
    const isSameDate = ev.dateStr === selectedDateStr;
    const isTypeMatch = activeFilter === 'All' || ev.type === activeFilter;
    return isSameDate && isTypeMatch;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Call': return <PhoneCall size={14} color="var(--accent-green)" />;
      case 'Meeting': return <Users size={14} color="var(--accent-green)" />;
      case 'Reminder': return <Bell size={14} color="var(--accent-green)" />;
      default: return <Clock size={14} color="var(--accent-green)" />;
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 3500 }}>
      <div
        className="modal-card animate-fade-in-up"
        style={{
          maxWidth: '760px',
          width: '94%',
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

        {/* Modal Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', paddingRight: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              <CalendarIcon size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Calendar & Call Scheduler
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Schedule voice calls, team meetings, and manage deadlines
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
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
            }}
          >
            <Plus size={15} /> Schedule Event
          </button>
        </div>

        {/* Calendar Main Grid & Timeline Section */}
        <div className="calendar-modal-grid" style={{ gap: '18px' }}>
          {/* LEFT: Calendar Grid */}
          <div
            style={{
              background: 'var(--bg-header)',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid var(--border-color)',
            }}
          >
            {/* Controls Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(Number(e.target.value))}
                  style={{
                    background: 'var(--bg-sidebar)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {monthNames.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>

                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(Number(e.target.value))}
                  style={{
                    background: 'var(--bg-sidebar)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {[2024, 2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={handleToday}
                  style={{
                    background: 'var(--bg-sidebar)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--accent-green)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Today
                </button>
                <button
                  onClick={handlePrevMonth}
                  style={{
                    background: 'var(--bg-sidebar)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextMonth}
                  style={{
                    background: 'var(--bg-sidebar)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Weekday Labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {daysOfWeek.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            {/* Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} style={{ height: '40px' }} />
              ))}

              {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = formatSelectedDateStr(dayNum);
                const isSelected = dayNum === selectedDay;
                const isToday =
                  dayNum === new Date().getDate() &&
                  currentMonth === new Date().getMonth() &&
                  currentYear === new Date().getFullYear();
                const dayEvs = events.filter((ev) => ev.dateStr === dateStr);

                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDay(dayNum)}
                    style={{
                      height: '40px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--accent-green)' : isToday ? 'var(--accent-green)' : 'transparent',
                      background: isSelected ? 'var(--accent-green)' : isToday ? 'rgba(0,168,132,0.12)' : 'var(--bg-sidebar)',
                      color: isSelected ? 'var(--accent-contrast-text)' : isToday ? 'var(--accent-green)' : 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: isSelected || isToday ? 800 : 500,
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{dayNum}</span>
                    {dayEvs.length > 0 && (
                      <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                        {dayEvs.slice(0, 3).map((_, idx) => (
                          <span
                            key={idx}
                            style={{
                              width: '4px',
                              height: '4px',
                              borderRadius: '50%',
                              background: isSelected ? '#ffffff' : 'var(--accent-green)',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Schedule Timeline Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {monthNames[currentMonth].slice(0, 3)} {selectedDay}, {currentYear}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {dayEvents.length} Event{dayEvents.length === 1 ? '' : 's'} Scheduled
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              {['All', 'Call', 'Meeting', 'Reminder'].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveFilter(t)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    border: 'none',
                    background: activeFilter === t ? 'var(--accent-green)' : 'var(--bg-header)',
                    color: activeFilter === t ? 'var(--accent-contrast-text)' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Events Timeline Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '240px' }}>
              {dayEvents.length > 0 ? (
                dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      background: 'var(--bg-header)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(0,168,132,0.12)', color: 'var(--accent-green)', fontWeight: 700 }}>
                          {getTypeIcon(ev.type)} {ev.type}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {ev.time} ({ev.duration})
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {ev.title}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Host: {ev.host} {ev.contactName ? `• With ${ev.contactName}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {ev.type === 'Call' && (
                        <button
                          onClick={() => handleStartCallForEvent(ev)}
                          title="Start Voice Call Now"
                          style={{
                            background: 'var(--accent-green)',
                            color: 'var(--accent-contrast-text)',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                          }}
                        >
                          <Phone size={12} /> Call
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        title="Delete Schedule"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 12px', textAlign: 'center', background: 'var(--bg-header)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                  <Clock size={24} color="var(--text-secondary)" style={{ marginBottom: '8px', opacity: 0.6 }} />
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>No schedules for this date</div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    style={{ marginTop: '8px', background: 'none', border: 'none', color: 'var(--accent-green)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Schedule Voice Call
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Popup Form for Adding Schedule */}
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
              onSubmit={handleAddEvent}
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
                  Schedule Event ({monthNames[currentMonth].slice(0, 3)} {selectedDay})
                </div>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Relay Voice Sync Call"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-header)', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Participant Contact</label>
                <select
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-header)', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Start Time</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-header)', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-header)', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }}
                  >
                    <option value="Call">Voice Call</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Reminder">Reminder</option>
                  </select>
                </div>
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
                  marginTop: '6px',
                }}
              >
                Save Schedule
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
