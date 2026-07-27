import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

const VoiceCallContext = createContext();

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const DEFAULT_CALL_HISTORY = [
  {
    id: 'call-sample-1',
    user: { id: 'sample-1', username: 'strange', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=strange' },
    type: 'missed',
    status: 'missed',
    duration: 'Missed',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'call-sample-2',
    user: { id: 'sample-2', username: 'alex', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex' },
    type: 'incoming',
    status: 'completed',
    duration: '04:12',
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'call-sample-3',
    user: { id: 'sample-3', username: 'sarah', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sarah' },
    type: 'outgoing',
    status: 'completed',
    duration: '01:45',
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'call-sample-4',
    user: { id: 'sample-1', username: 'strange', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=strange' },
    type: 'missed',
    status: 'missed',
    duration: 'Missed',
    timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    read: false,
  },
];

export const VoiceCallProvider = ({ children }) => {
  const { profile } = useAuth();
  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'connected' | 'ended'
  const [callType, setCallType] = useState('audio'); // 'audio' | 'video'
  const [callPartner, setCallPartner] = useState(null); // profile object of partner
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const historyKey = profile?.id ? `relay_call_history_${profile.id}` : 'relay_call_history';
  const [callHistory, setCallHistory] = useState([]);

  // Load history when profile changes
  useEffect(() => {
    try {
      if (!profile) {
        setCallHistory([]);
        return;
      }
      const saved = localStorage.getItem(historyKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filter out dummy data
        setCallHistory(parsed.filter(call => !call.id.startsWith('call-sample')));
      } else {
        setCallHistory([]); // No longer loading default dummy data
      }
    } catch (e) {
      console.error('Failed to load call history:', e);
      setCallHistory([]);
    }
  }, [profile, historyKey]);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(new Audio());
  const signalingChannelRef = useRef(null);
  const timerRef = useRef(null);

  // Save call history to localStorage
  useEffect(() => {
    if (!profile) return;
    try {
      localStorage.setItem(historyKey, JSON.stringify(callHistory));
    } catch (e) {
      console.error('Failed to save call history:', e);
    }
  }, [callHistory, historyKey, profile]);

  // Helper to add call record
  const addCallRecord = useCallback(({ user, type, status, duration = '00:00' }) => {
    if (!user) return;
    const newRecord = {
      id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      user: {
        id: user.id,
        username: user.username || 'Unknown User',
        avatar_url: user.avatar_url,
        email: user.email,
      },
      type, // 'missed' | 'incoming' | 'outgoing'
      status, // 'missed' | 'completed' | 'declined' | 'cancelled'
      duration,
      timestamp: new Date().toISOString(),
      read: type !== 'missed',
    };

    setCallHistory((prev) => [newRecord, ...prev]);
  }, []);

  // Mark all missed calls as read
  const markMissedCallsRead = useCallback(() => {
    setCallHistory((prev) =>
      prev.map((item) => (item.type === 'missed' ? { ...item, read: true } : item))
    );
  }, []);

  // Delete call record
  const deleteCallRecord = useCallback((id) => {
    setCallHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Clear all call history
  const clearCallHistory = useCallback(() => {
    setCallHistory([]);
  }, []);

  // Unread missed calls count
  const missedCount = callHistory.filter((item) => item.type === 'missed' && !item.read).length;

  // Setup Supabase WebRTC Signaling Channel
  useEffect(() => {
    if (!profile || !supabase) return;

    const channel = supabase.channel('webrtc-voice-signaling');

    channel
      .on('broadcast', { event: 'call-signal' }, async ({ payload }) => {
        if (!payload || payload.targetId !== profile.id) return;

        const { type, caller, signalData } = payload;

        if (type === 'call-request') {
          // Received incoming call request
          setCallPartner(caller);
          setCallType(signalData?.callType || 'audio');
          setCallState('incoming');
        } else if (type === 'call-accept') {
          // Callee accepted call -> create WebRTC Offer
          if (callState === 'calling') {
            initiateWebRTCOffer(payload.senderId);
          }
        } else if (type === 'call-reject') {
          // Callee rejected call
          addCallRecord({
            user: callPartner || caller,
            type: 'outgoing',
            status: 'declined',
            duration: 'Declined',
          });
          cleanupCall('Call declined');
        } else if (type === 'offer') {
          // Received WebRTC Offer -> handle offer & send answer
          handleWebRTCOffer(signalData, payload.senderId);
        } else if (type === 'answer') {
          // Received WebRTC Answer
          handleWebRTCAnswer(signalData);
        } else if (type === 'ice-candidate') {
          // Received ICE candidate
          if (peerConnectionRef.current && signalData) {
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signalData));
            } catch (err) {
              console.error('Error adding ICE candidate:', err);
            }
          }
        } else if (type === 'call-end') {
          // Call ended by caller/callee
          if (callState === 'incoming') {
            // Caller hung up before answer -> Missed call!
            addCallRecord({
              user: caller || callPartner,
              type: 'missed',
              status: 'missed',
              duration: 'Missed',
            });
          } else if (callState === 'connected') {
            addCallRecord({
              user: callPartner || caller,
              type: 'incoming',
              status: 'completed',
              duration: formatDuration(callDuration),
            });
          }
          cleanupCall('Call ended');
        }
      })
      .subscribe();

    signalingChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, callState, callPartner, callDuration, addCallRecord]);

  // Call timer effect
  useEffect(() => {
    if (callState === 'connected') {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Helper to send WebRTC signals via Supabase Broadcast
  const sendSignal = (targetId, type, signalData = null) => {
    if (!signalingChannelRef.current || !profile) return;

    signalingChannelRef.current.send({
      type: 'broadcast',
      event: 'call-signal',
      payload: {
        senderId: profile.id,
        targetId,
        caller: profile,
        type,
        signalData,
      },
    });
  };

  // Start outgoing call
  const startCall = async (targetUser, type = 'audio') => {
    if (!targetUser || !profile) return;
    setCallPartner(targetUser);
    setCallType(type);
    setCallState('calling');
    setIsMuted(false);

    try {
      // Request local audio/video stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Broadcast call request to target user
      sendSignal(targetUser.id, 'call-request', { callType: type });

      // Trigger Push Notification Edge Function for Receiver
      supabase.functions.invoke('notify-call', {
        body: {
          targetId: targetUser.id,
          callerName: profile.username || 'Someone',
          callerId: profile.id,
          isVideo: type === 'video'
        }
      }).catch(err => console.error('Push notification failed:', err));

    } catch (err) {
      console.error('Microphone/Camera permission error:', err);
      alert('Could not access microphone/camera. Please allow permissions to make calls.');
      cleanupCall();
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!callPartner || !profile) return;

    try {
      // Request local stream based on call type
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
      localStreamRef.current = stream;
      setLocalStream(stream);

      setCallState('connected');
      // Send accept signal
      sendSignal(callPartner.id, 'call-accept');
    } catch (err) {
      console.error('Microphone error on accept:', err);
      alert('Microphone access denied.');
      rejectCall();
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (callPartner) {
      addCallRecord({
        user: callPartner,
        type: 'missed',
        status: 'missed',
        duration: 'Missed',
      });
      sendSignal(callPartner.id, 'call-reject');
    }
    cleanupCall();
  };

  // End active or pending call
  const endCall = () => {
    if (callPartner) {
      const type = callState === 'connected' ? 'outgoing' : 'outgoing';
      const status = callState === 'connected' ? 'completed' : 'cancelled';
      const duration = callState === 'connected' ? formatDuration(callDuration) : 'Cancelled';

      addCallRecord({
        user: callPartner,
        type,
        status,
        duration,
      });

      sendSignal(callPartner.id, 'call-end');
    }
    cleanupCall();
  };

  // Initiate WebRTC Offer (Caller side)
  const initiateWebRTCOffer = async (targetId) => {
    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add local audio tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(targetId, 'ice-candidate', event.candidate);
        }
      };

      // Handle incoming remote audio/video track
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch((e) => console.error('Audio play error:', e));
          setRemoteStream(event.streams[0]);
        }
      };

      // Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendSignal(targetId, 'offer', offer);
      setCallState('connected');
    } catch (err) {
      console.error('Error initiating WebRTC offer:', err);
      cleanupCall();
    }
  };

  // Handle WebRTC Offer (Callee side)
  const handleWebRTCOffer = async (offer, senderId) => {
    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(senderId, 'ice-candidate', event.candidate);
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch((e) => console.error('Audio play error:', e));
          setRemoteStream(event.streams[0]);
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal(senderId, 'answer', answer);
      setCallState('connected');
    } catch (err) {
      console.error('Error handling WebRTC offer:', err);
      cleanupCall();
    }
  };

  // Handle WebRTC Answer
  const handleWebRTCAnswer = async (answer) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (err) {
      console.error('Error setting remote description:', err);
    }
  };

  // Toggle Mute Microphone
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Speaker / Earpiece
  const toggleSpeaker = () => {
    const newSpeaker = !isSpeaker;
    setIsSpeaker(newSpeaker);
    const audioEl = remoteAudioRef.current;
    if (audioEl && typeof audioEl.setSinkId === 'function') {
      // 'default' = speaker, 'communications' = earpiece on mobile
      audioEl.setSinkId(newSpeaker ? 'default' : 'communications').catch((err) => {
        console.warn('setSinkId not fully supported:', err);
      });
    }
  };

  // Cleanup WebRTC resources and streams
  const cleanupCall = (reason = '') => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setCallState('idle');
    setCallPartner(null);
    setIsMuted(false);
    setIsSpeaker(true);
    setCallDuration(0);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <VoiceCallContext.Provider
      value={{
        callState,
        callType,
        callPartner,
        isMuted,
        isSpeaker,
        callDuration,
        localStream,
        remoteStream,
        formattedDuration: formatDuration(callDuration),
        callHistory,
        missedCount,
        addCallRecord,
        markMissedCallsRead,
        deleteCallRecord,
        clearCallHistory,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleSpeaker,
      }}
    >
      {children}
    </VoiceCallContext.Provider>
  );
};

export default VoiceCallContext;
export const useVoiceCall = () => useContext(VoiceCallContext);
