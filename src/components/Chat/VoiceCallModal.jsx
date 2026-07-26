import React, { useState, useRef, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, Minimize2, Maximize2, Video, VideoOff } from 'lucide-react';
import { useVoiceCall } from '../../context/VoiceCallContext';
import { useTheme } from '../../context/ThemeContext';

export default function VoiceCallModal() {
  const { callState, callType, callPartner, isMuted, localStream, remoteStream, formattedDuration, acceptCall, rejectCall, endCall, toggleMute } = useVoiceCall();
  const { theme } = useTheme();
  const [isMinimized, setIsMinimized] = useState(false);
  const [pos, setPos] = useState({ x: -1, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = React.useRef({ startX: 0, startY: 0, moved: false });
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState, isMinimized]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState, isMinimized]);

  if (callState === 'idle' || !callPartner) return null;

  const isDark = theme === 'dark';

  if (isMinimized && pos.x === -1 && typeof window !== 'undefined') {
    setPos({ x: (window.innerWidth / 2) - 120, y: 16 });
  }

  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragStart.current = {
      startX: e.clientX - pos.x,
      startY: e.clientY - pos.y,
      moved: false
    };
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    dragStart.current.moved = true;
    let newX = e.clientX - dragStart.current.startX;
    let newY = e.clientY - dragStart.current.startY;
    
    const maxX = window.innerWidth - (callType === 'video' ? 140 : 240);
    const maxY = window.innerHeight - (callType === 'video' ? 180 : 80);
    setPos({ x: Math.max(8, Math.min(newX, maxX)), y: Math.max(8, Math.min(newY, maxY)) });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  const handleCapsuleClick = () => {
    if (!dragStart.current.moved) {
      setIsMinimized(false);
    }
  };

  // --- MINIMIZED PiP VIEW ---
  if (isMinimized) {
    if (callType === 'video') {
      return (
        <div
          className={pos.x === -1 ? "animate-fade-in-up" : ""}
          style={{
            position: 'fixed',
            top: pos.y + 'px',
            left: pos.x > -1 ? pos.x + 'px' : '50%',
            transform: pos.x > -1 ? 'none' : 'translateX(-50%)',
            zIndex: 10002,
            width: '120px',
            height: '160px',
            background: '#000',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none',
            border: '2px solid var(--accent-green)'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleCapsuleClick}
        >
          {remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#111' }}>
              <img src={callPartner.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${callPartner.username}`} alt={callPartner.username} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
            </div>
          )}
          <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '36px', height: '48px', background: '#222', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)' }}>
             <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      );
    }

    // Audio Minimized
    return (
      <div
        className={pos.x === -1 ? "animate-fade-in-up" : ""}
        style={{
          position: 'fixed',
          top: pos.y + 'px',
          left: pos.x > -1 ? pos.x + 'px' : '50%',
          transform: pos.x > -1 ? 'none' : 'translateX(-50%)',
          zIndex: 10002,
          background: isDark ? 'rgba(17, 27, 33, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--accent-green)',
          borderRadius: '30px',
          padding: '8px 16px 8px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleCapsuleClick}
      >
        <div style={{ position: 'relative' }}>
          {(callState === 'calling' || callState === 'connected' || callState === 'incoming') && (
            <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', background: callState === 'connected' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(2, 132, 199, 0.3)', animation: 'pulse 1.8s infinite ease-out' }} />
          )}
          <img src={callPartner.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${callPartner.username}`} alt={callPartner.username} style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-green)' }} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', marginRight: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{callPartner.username}</span>
          <span style={{ fontSize: '11px', color: callState === 'connected' ? '#10b981' : 'var(--text-secondary)' }}>
            {callState === 'calling' ? 'Ringing' : callState === 'incoming' ? 'Incoming' : formattedDuration}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
          {callState === 'connected' && (
            <button type="button" onClick={toggleMute} style={{ width: '32px', height: '32px', borderRadius: '50%', background: isMuted ? 'rgba(239, 68, 68, 0.15)' : 'transparent', border: 'none', color: isMuted ? '#ef4444' : 'var(--text-primary)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}
          <button type="button" onClick={endCall} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
            <PhoneOff size={14} />
          </button>
        </div>
      </div>
    );
  }

  // --- FULL SCREEN VIEW ---
  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 2000, background: callType === 'video' ? '#000' : 'var(--overlay-bg)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center' }}>
      
      {/* Minimize Button */}
      <button onClick={() => setIsMinimized(true)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#fff', zIndex: 2010 }} title="Minimize Call">
        <Minimize2 size={20} />
      </button>

      {callType === 'video' ? (
        // Video Full Screen Layout
        <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
              <img src={callPartner.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${callPartner.username}`} alt={callPartner.username} style={{ width: '120px', height: '120px', borderRadius: '50%', marginBottom: '20px' }} />
              <h2 style={{ color: '#fff', fontSize: '24px', margin: 0 }}>{callPartner.username}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>{callState === 'calling' ? 'Ringing...' : 'Connecting...'}</p>
            </div>
          )}

          {/* Local Video Overlay */}
          <div style={{ position: 'absolute', top: '24px', left: '24px', width: '110px', height: '160px', background: '#222', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 2005 }}>
            <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          </div>

          {/* Controls Overlay */}
          <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '20px', padding: '16px 24px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', borderRadius: '40px', zIndex: 2005 }}>
            {callState === 'incoming' ? (
              <>
                <button type="button" onClick={rejectCall} style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ef4444', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                  <PhoneOff size={24} />
                </button>
                <button type="button" onClick={acceptCall} style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#10b981', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                  <Video size={24} />
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={toggleMute} style={{ width: '56px', height: '56px', borderRadius: '50%', background: isMuted ? 'rgba(239, 68, 68, 0.9)' : 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                  {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                <button type="button" onClick={endCall} style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ef4444', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                  <PhoneOff size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        // Audio Full Screen Layout
        <div className="modal-card voice-call-card animate-fade-in-up" style={{ width: '320px', padding: '28px 24px', borderRadius: '24px', background: isDark ? '#111b21' : '#ffffff', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          
          <div style={{ position: 'relative', margin: '20px 0 20px' }}>
            {(callState === 'calling' || callState === 'connected' || callState === 'incoming') && (
              <div style={{ position: 'absolute', inset: '-12px', borderRadius: '50%', background: callState === 'connected' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(2, 132, 199, 0.2)', animation: 'pulse 1.8s infinite ease-out' }} />
            )}
            <img src={callPartner.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${callPartner.username}`} alt={callPartner.username} style={{ position: 'relative', width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-green)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }} />
          </div>

          <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px', letterSpacing: '-0.3px' }}>
            {callPartner.username}
          </h3>

          <div style={{ fontSize: '13px', fontWeight: 500, color: callState === 'connected' ? '#10b981' : 'var(--text-secondary)', marginBottom: '24px' }}>
            {callState === 'calling' && 'Ringing...'}
            {callState === 'incoming' && 'Incoming Voice Call'}
            {callState === 'connected' && `Connected • ${formattedDuration}`}
          </div>

          {callState === 'incoming' ? (
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <button type="button" onClick={rejectCall} style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ef4444', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }} title="Decline">
                <PhoneOff size={24} />
              </button>
              <button type="button" onClick={acceptCall} style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#10b981', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }} title="Accept">
                <Phone size={24} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
              <button type="button" onClick={toggleMute} style={{ width: '48px', height: '48px', borderRadius: '50%', background: isMuted ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-input)', border: isMuted ? '1px solid #ef4444' : '1px solid var(--border-color)', color: isMuted ? '#ef4444' : 'var(--text-primary)', cursor: 'pointer', display: 'grid', placeItems: 'center', transition: 'all 0.15s ease' }} title={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button type="button" onClick={endCall} style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ef4444', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }} title="End Call">
                <PhoneOff size={24} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
