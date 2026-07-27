import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase, SUPABASE_URL } from '../lib/supabaseClient';
import { playSendSound, playReceiveSound } from '../lib/soundEffects';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { profile } = useAuth();
  const recentStorageKey = profile?.id ? `relay_recent_partners_${profile.id}` : 'relay_recent_partners';
  const groupStorageKey = profile?.id ? `relay_user_groups_${profile.id}` : 'relay_user_groups';
  const archivedStorageKey = profile?.id ? `relay_archived_users_${profile.id}` : 'relay_archived_users';
  const blockedStorageKey = profile?.id ? `relay_blocked_users_${profile.id}` : 'relay_blocked_users';
  const pinnedStorageKey = profile?.id ? `relay_pinned_users_${profile.id}` : 'relay_pinned_users';

  const [allUsers, setAllUsers] = useState([]);

  const [recentPartnerIds, setRecentPartnerIds] = useState(() => {
    const saved = localStorage.getItem(recentStorageKey);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Critical fix: If profile loads asynchronously, re-hydrate state from the correct keys
  useEffect(() => {
    if (profile?.id) {
      const savedRecent = localStorage.getItem(recentStorageKey);
      if (savedRecent) setRecentPartnerIds(new Set(JSON.parse(savedRecent)));
      
      const savedPinned = localStorage.getItem(pinnedStorageKey);
      if (savedPinned) setPinnedUserIds(new Set(JSON.parse(savedPinned)));
      
      const savedArchived = localStorage.getItem(archivedStorageKey);
      if (savedArchived) setArchivedUserIds(new Set(JSON.parse(savedArchived)));
      
      const savedBlocked = localStorage.getItem(blockedStorageKey);
      if (savedBlocked) setBlockedUserIds(new Set(JSON.parse(savedBlocked)));
    }
  }, [profile?.id, recentStorageKey, pinnedStorageKey, archivedStorageKey, blockedStorageKey]);

  const updateRecentPartners = useCallback((partnerId) => {
    setRecentPartnerIds((prev) => {
      const next = new Set([...prev, partnerId]);
      localStorage.setItem(recentStorageKey, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [recentStorageKey]);

  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loadingChat, setLoadingChat] = useState(false);

  // ── In-app notification state ───────────────────────────────────
  const [inAppNotification, setInAppNotification] = useState(null);
  const notifTimeoutRef = useRef(null);

  const showInAppNotification = useCallback((notif) => {
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    setInAppNotification(notif);
    notifTimeoutRef.current = setTimeout(() => setInAppNotification(null), 4000);
  }, []);

  const dismissNotification = useCallback(() => {
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    setInAppNotification(null);
  }, []);

  // Listen for push messages forwarded by the service worker when app is focused.
  // The SW sends PUSH_WHILE_FOCUSED instead of showing a native notification.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handleSwMessage = (event) => {
      if (!event.data || event.data.type !== 'PUSH_WHILE_FOCUSED') return;
      const data = event.data.payload || {};
      // Show in-app toast using the push payload
      showInAppNotification({
        senderId: data.senderId || null,
        senderName: data.title || 'Relay',
        senderAvatar: data.icon || '/relay-icon-192.png',
        content: data.body || '',
      });
    };
    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleSwMessage);
  }, [showInAppNotification]);
  const presenceChannelRef = useRef(null);
  const typingTimeoutRef = useRef({});

  // Fetch all registered user profiles (for searching)
  const fetchAllUsers = useCallback(async () => {
    if (!profile || !supabase) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', profile.id)
      .order('username', { ascending: true });

    if (data) setAllUsers(data);
  }, [profile]);

  // Fetch recent conversation partners & initial unread counts
  const fetchRecentConversations = useCallback(async () => {
    if (!profile || !supabase) return;

    const { data: recentMsgs } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, is_read, created_at')
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
      .order('created_at', { ascending: true });

    if (recentMsgs) {
      const partnerSet = new Set();
      const counts = {};
      const latestMsgs = {};

      recentMsgs.forEach((m) => {
        const partnerId = m.sender_id === profile.id ? m.receiver_id : m.sender_id;
        partnerSet.add(partnerId);

        if (m.receiver_id === profile.id && !m.is_read) {
          counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
        }

        latestMsgs[partnerId] = m;
      });

      setRecentPartnerIds((prev) => {
        const merged = new Set(prev);
        partnerSet.forEach((id) => merged.add(id));
        const key = profile?.id ? `relay_recent_partners_${profile.id}` : 'relay_recent_partners';
        localStorage.setItem(key, JSON.stringify(Array.from(merged)));
        return merged;
      });
      
      setUnreadCounts(counts);
      setLastMessages(latestMsgs);
    }
  }, [profile]);

  // Groups State & Methods

  const [groupsList, setGroupsList] = useState(() => {
    const saved = localStorage.getItem(groupStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter(g => !['group_1', 'group_2', 'group_3'].includes(g.id));
      } catch {
        // fallback
      }
    }
    return [];
  });

  const createGroup = useCallback(
    ({ name, desc, memberIds = [], initialNotice }) => {
      const groupId = `group_${Date.now()}`;
      const newGrp = {
        id: groupId,
        username: name.trim(),
        email: `${memberIds.length + 1} members • Active Just now`,
        desc: desc.trim() || 'Team group chat',
        isGroup: true,
        membersCount: memberIds.length + 1,
        members: memberIds,
        avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
      };

      setGroupsList((prev) => {
        const next = [newGrp, ...prev];
        localStorage.setItem(groupStorageKey, JSON.stringify(next));
        return next;
      });

      const noticeText = initialNotice || `You were added to group "${name.trim()}"`;
      const systemMsg = {
        id: `sys_${Date.now()}`,
        sender_id: profile?.id || 'system',
        receiver_id: groupId,
        content: `[SYSTEM] 🔒 ${noticeText}`,
        created_at: new Date().toISOString(),
        is_read: true,
      };

      if (profile && supabase) {
        supabase.from('messages').insert({
          sender_id: profile.id,
          receiver_id: groupId,
          content: `[SYSTEM] 🔒 ${noticeText}`,
          is_read: true,
        }).then(() => {}).catch(() => {});
      }

      setLastMessages((prev) => ({ ...prev, [groupId]: systemMsg }));
      setActiveUser(newGrp);
      return newGrp;
    },
    [groupStorageKey, profile]
  );

  const [friendships, setFriendships] = useState([]);

  const fetchFriendships = useCallback(async () => {
    if (!profile || !supabase) return;
    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`);
    
    if (data) setFriendships(data);
  }, [profile]);

  const getFriendship = useCallback((targetUserId) => {
    if (!profile) return null;
    return friendships.find(f => 
      (f.requester_id === profile.id && f.receiver_id === targetUserId) ||
      (f.receiver_id === profile.id && f.requester_id === targetUserId)
    );
  }, [friendships, profile]);

  const getPrivacyMaskedAvatar = useCallback((user) => {
    if (!profile || !user) return '';
    if (user.id === profile.id) return user.avatar_url;
    
    const isFriend = getFriendship(user.id)?.status === 'accepted';
    const picPrivacy = user.privacy_profile_picture || 'friends';
    
    if (picPrivacy === 'nobody') return `https://api.dicebear.com/7.x/bottts/svg?seed=hidden`;
    if (picPrivacy === 'friends' && !isFriend) return `https://api.dicebear.com/7.x/bottts/svg?seed=hidden`;
    
    return user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`;
  }, [profile, getFriendship]);

  const getPrivacyMaskedLastSeen = useCallback((user) => {
    if (!profile || !user) return null;
    if (user.id === profile.id) return user.last_seen;

    const isFriend = getFriendship(user.id)?.status === 'accepted';
    const lsPrivacy = user.privacy_last_seen || 'friends';

    if (lsPrivacy === 'nobody') return null;
    if (lsPrivacy === 'friends' && !isFriend) return null;

    return user.last_seen;
  }, [profile, getFriendship]);

  useEffect(() => {
    if (profile) {
      fetchAllUsers();
      fetchRecentConversations();
      fetchFriendships();
    }
  }, [profile, fetchAllUsers, fetchRecentConversations, fetchFriendships]);

  // Subscription for friendships & Real-time Friend Request Notifications
  useEffect(() => {
    if (!profile || !supabase) return;
    
    const friendSub = supabase
      .channel('public:friendships')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        (payload) => {
          fetchFriendships();
          if (payload.eventType === 'INSERT' && payload.new?.receiver_id === profile.id && payload.new?.status === 'pending') {
            playReceiveSound();
            const requesterProfile = allUsers.find(u => u.id === payload.new.requester_id);
            const senderName = requesterProfile?.username || 'Someone';
            const senderAvatar = requesterProfile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${payload.new.requester_id}`;
            
            // Show in-app toast when visible; use SW for background notifications
            if (document.visibilityState === 'visible') {
              showInAppNotification({
                senderId: payload.new.requester_id,
                senderName,
                senderAvatar,
                content: '👋 Sent you a friend request!',
              });
            } else if ('serviceWorker' in navigator && Notification.permission === 'granted') {
              navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification(`Friend Request from ${senderName}`, {
                  body: `${senderName} wants to connect with you on Relay`,
                  icon: senderAvatar,
                  badge: '/relay-icon-192-dark.png',
                  tag: `relay-friend-req-${payload.new.requester_id}`,
                  data: { url: '/' },
                  vibrate: [200, 100, 200],
                });
              }).catch(() => {});
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(friendSub);
    };
  }, [profile, fetchFriendships, allUsers, showInAppNotification]);

  const pendingRequestCount = friendships.filter(f => f.receiver_id === profile?.id && f.status === 'pending').length;

  const [archivedUserIds, setArchivedUserIds] = useState(() => {
    const key = profile?.id ? `relay_archived_users_${profile.id}` : 'relay_archived_users';
    const saved = localStorage.getItem(key);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const toggleArchiveUser = useCallback((userId) => {
    setArchivedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      const key = profile?.id ? `relay_archived_users_${profile.id}` : 'relay_archived_users';
      localStorage.setItem(key, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [profile?.id]);

  const [blockedUserIds, setBlockedUserIds] = useState(() => {
    const key = profile?.id ? `relay_blocked_users_${profile.id}` : 'relay_blocked_users';
    const saved = localStorage.getItem(key);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const toggleBlockUser = useCallback((userId) => {
    setBlockedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      const key = profile?.id ? `relay_blocked_users_${profile.id}` : 'relay_blocked_users';
      localStorage.setItem(key, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [profile?.id]);

  // Sidebar users are direct partners + groups list (excluding archived chats)
  const sidebarUsers = [
    ...groupsList.filter((g) => !archivedUserIds.has(g.id)),
    ...allUsers.filter((u) => (recentPartnerIds.has(u.id) || activeUser?.id === u.id) && !archivedUserIds.has(u.id)),
  ].sort((a, b) => {
    const timeA = lastMessages[a.id]?.created_at
      ? new Date(lastMessages[a.id].created_at).getTime()
      : (a.last_seen ? new Date(a.last_seen).getTime() : 0);
    const timeB = lastMessages[b.id]?.created_at
      ? new Date(lastMessages[b.id].created_at).getTime()
      : (b.last_seen ? new Date(b.last_seen).getTime() : 0);
    return timeB - timeA;
  });

  const startNewChat = async (targetUser) => {
    if (!targetUser) {
      setActiveUser(null);
      return;
    }
    if (!targetUser.id) return;
    
    setActiveUser(targetUser);
    updateRecentPartners(targetUser.id);

    // Clear unread count for this user when opening their chat
    setUnreadCounts((prev) => ({ ...prev, [targetUser.id]: 0 }));

    if (supabase && profile?.id) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', targetUser.id)
        .eq('receiver_id', profile.id)
        .eq('is_read', false);
    }
  };

  // Live PostgreSQL profile updates subscription
  useEffect(() => {
    if (!profile || !supabase) return;

    const profileSub = supabase
      .channel('profiles-live-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          const updatedProfile = payload.new;
          if (!updatedProfile || updatedProfile.id === profile.id) return;

          setAllUsers((prev) =>
            prev.map((u) => (u.id === updatedProfile.id ? { ...u, ...updatedProfile } : u))
          );

          if (activeUser?.id === updatedProfile.id) {
            setActiveUser((prev) => (prev ? { ...prev, ...updatedProfile } : null));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSub);
    };
  }, [profile, activeUser]);

  // Real-time Presence & Typing via Supabase WebSockets
  useEffect(() => {
    if (!profile || !supabase) return;

    const channel = supabase.channel('online-presence', {
      config: { presence: { key: profile.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        setOnlineUsers(new Set(Object.keys(newState)));
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== profile.id) {
          setTypingUsers((prev) => ({ ...prev, [payload.userId]: payload.isTyping }));

          if (typingTimeoutRef.current[payload.userId]) {
            clearTimeout(typingTimeoutRef.current[payload.userId]);
          }
          if (payload.isTyping) {
            typingTimeoutRef.current[payload.userId] = setTimeout(() => {
              setTypingUsers((prev) => ({ ...prev, [payload.userId]: false }));
            }, 3000);
          }
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: profile.id, online_at: new Date().toISOString() });
        }
      });

    presenceChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  // Fetch Message History for current active conversation
  const fetchMessages = useCallback(async () => {
    if (!profile || !activeUser || !supabase) return;
    setLoadingChat(true);

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${profile.id},receiver_id.eq.${activeUser.id}),and(sender_id.eq.${activeUser.id},receiver_id.eq.${profile.id})`
      )
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
      if (data.length > 0) {
        const lastMsg = data[data.length - 1];
        setLastMessages((prev) => ({ ...prev, [activeUser.id]: lastMsg }));
      }
      const unreadIds = data
        .filter((m) => m.sender_id === activeUser.id && !m.is_read)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
        setUnreadCounts((prev) => ({ ...prev, [activeUser.id]: 0 }));
      }
    }
    setLoadingChat(false);
  }, [profile, activeUser]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to real-time message changes & unread message count updates
  useEffect(() => {
    if (!profile || !supabase) return;

    const globalMsgSub = supabase
      .channel('global-incoming-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg.sender_id === profile.id || newMsg.receiver_id === profile.id) {
            const partnerId = newMsg.sender_id === profile.id ? newMsg.receiver_id : newMsg.sender_id;
            setRecentPartnerIds((prev) => {
              const next = new Set([...prev, partnerId]);
              const key = profile?.id ? `relay_recent_partners_${profile.id}` : 'relay_recent_partners';
              localStorage.setItem(key, JSON.stringify(Array.from(next)));
              return next;
            });
            setLastMessages((prev) => ({ ...prev, [partnerId]: newMsg }));

            // If new message comes from someone else:
            if (newMsg.receiver_id === profile.id) {
              playReceiveSound();
              if (activeUser?.id === newMsg.sender_id) {
                // If chat is open, append message and mark read
                setMessages((prev) => {
                  if (prev.some((m) => m.id === newMsg.id)) return prev;
                  return [...prev, newMsg];
                });
                supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id);
              } else {
                // If chat is NOT open, increment unread badge count!
                setUnreadCounts((prev) => ({
                  ...prev,
                  [newMsg.sender_id]: (prev[newMsg.sender_id] || 0) + 1,
                }));

                const senderProfile = allUsers.find(u => u.id === newMsg.sender_id);
                const senderName = senderProfile?.username || 'Someone';
                const senderAvatar = senderProfile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${newMsg.sender_id}`;

                if (document.visibilityState === 'visible') {
                  // Show in-app toast notification when user is actively looking at the app
                  showInAppNotification({
                    senderId: newMsg.sender_id,
                    senderName,
                    senderAvatar,
                    content: newMsg.content,
                  });
                } else if ('serviceWorker' in navigator && Notification.permission === 'granted') {
                  // App is backgrounded — use SW showNotification (reliable, works on iOS PWA too)
                  navigator.serviceWorker.ready.then((reg) => {
                    reg.showNotification(senderName, {
                      body: newMsg.content,
                      icon: senderAvatar,
                      badge: '/relay-icon-192-dark.png',
                      tag: `relay-msg-${newMsg.sender_id}`,
                      data: { url: '/' },
                      vibrate: [200, 100, 200],
                      renotify: true,
                    });
                  }).catch(() => {});
                }
              }
            } else if (activeUser?.id === newMsg.receiver_id) {
              // Message sent by self - de-duplicate with optimistic state smoothly
              setMessages((prev) => {
                const existingIndex = prev.findIndex(
                  (m) =>
                    m.id === newMsg.id ||
                    (m.client_key && (m.client_key === newMsg.client_key || m.client_key === newMsg.id)) ||
                    (m.sending && m.content === newMsg.content)
                );
                if (existingIndex !== -1) {
                  const existing = prev[existingIndex];
                  const fullMsg = { ...newMsg, client_key: existing.client_key || existing.id, sending: false };
                  const updated = [...prev];
                  updated[existingIndex] = fullMsg;
                  return updated;
                }
                return [...prev, newMsg];
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const updatedMsg = payload.new;
          setMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(globalMsgSub);
    };
  }, [profile, activeUser]);

  // Send message to Supabase PostgreSQL with Instant (<1ms) Optimistic UI & Stable Keys
  const sendMessage = async (content) => {
    if (!content.trim() || !profile || !activeUser || !supabase) return;

    const trimmedContent = content.trim();
    const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const nowIso = new Date().toISOString();

    const optimisticMsg = {
      id: tempId,
      client_key: tempId,
      sender_id: profile.id,
      receiver_id: activeUser.id,
      content: trimmedContent,
      is_read: false,
      created_at: nowIso,
      sending: true,
    };

    // 1. Instantly append to messages array & update last messages & sidebar order (< 1ms!)
    setMessages((prev) => [...prev, optimisticMsg]);
    setLastMessages((prev) => ({ ...prev, [activeUser.id]: optimisticMsg }));
    updateRecentPartners(activeUser.id);
    playSendSound();

    // 2. Perform Supabase DB insertion in background without blocking UI
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{ sender_id: profile.id, receiver_id: activeUser.id, content: trimmedContent, is_read: false }])
        .select()
        .single();

      if (error) {
        console.error('Supabase DB message insert error:', error);
        return;
      }

      if (data) {
        // Retain stable client_key so React does not re-mount or glitch animations!
        const fullMsg = { ...data, client_key: tempId };
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId || m.client_key === tempId ? fullMsg : m))
        );
        setLastMessages((prev) => ({ ...prev, [activeUser.id]: fullMsg }));

        // 3. Fire push notification to receiver via Edge Function (non-blocking)
        if (SUPABASE_URL && !activeUser.isGroup) {
          fetch(`${SUPABASE_URL}/functions/v1/notify-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
            body: JSON.stringify({ type: 'INSERT', table: 'messages', record: { sender_id: profile.id, receiver_id: activeUser.id, content: trimmedContent } }),
          }).catch(() => {}); // Fire-and-forget, don't block UI
        }

        return fullMsg;
      }
    } catch (err) {
      console.error('Background send error:', err);
    }
  };

  // Send broadcast typing indicator
  const sendTypingStatus = (isTyping) => {
    if (!profile || !activeUser || !presenceChannelRef.current) return;

    presenceChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: profile.id, receiverId: activeUser.id, isTyping },
    });
  };

  const [pinnedUserIds, setPinnedUserIds] = useState(() => {
    const key = profile?.id ? `relay_pinned_users_${profile.id}` : 'relay_pinned_users';
    const saved = localStorage.getItem(key);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const togglePinUser = useCallback((userId) => {
    setPinnedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      const key = profile?.id ? `relay_pinned_users_${profile.id}` : 'relay_pinned_users';
      localStorage.setItem(key, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [profile?.id]);

  const deleteChat = useCallback(async (targetId) => {
    setMessages([]);
    setRecentPartnerIds((prev) => {
      const next = new Set(prev);
      next.delete(targetId);
      localStorage.setItem(recentStorageKey, JSON.stringify(Array.from(next)));
      return next;
    });

    if (activeUser?.id === targetId) {
      setActiveUser(null);
    }

    if (supabase && profile) {
      try {
        await supabase
          .from('messages')
          .delete()
          .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${profile.id})`);
      } catch (err) {
        console.warn('Delete chat notice:', err);
      }
    }
  }, [profile, activeUser]);

  const deleteGroup = useCallback((groupId) => {
    setGroupsList((prev) => {
      const next = prev.filter((g) => g.id !== groupId);
      localStorage.setItem(groupStorageKey, JSON.stringify(next));
      return next;
    });

    if (activeUser?.id === groupId) {
      setActiveUser(null);
    }
  }, [groupStorageKey, activeUser]);

  const leaveGroup = useCallback((groupId) => {
    setGroupsList((prev) => {
      const next = prev.filter((g) => g.id !== groupId);
      localStorage.setItem(groupStorageKey, JSON.stringify(next));
      return next;
    });

    if (activeUser?.id === groupId) {
      setActiveUser(null);
    }
  }, [groupStorageKey, activeUser]);

  // Real-time last_seen heartbeat
  useEffect(() => {
    if (!profile || !supabase) return;

    const pingLastSeen = async () => {
      try {
        await supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', profile.id);
      } catch (err) {}
    };

    pingLastSeen();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        pingLastSeen();
      }
    }, 120000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pingLastSeen();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [profile]);

  return (
    <ChatContext.Provider
      value={{
        allUsers,
        users: sidebarUsers,
        friendships,
        pendingRequestCount,
        fetchFriendships,
        getFriendship,
        getPrivacyMaskedAvatar,
        getPrivacyMaskedLastSeen,
        activeUser,
        setActiveUser: startNewChat,
        messages,
        unreadCounts,
        lastMessages,
        loadingChat,
        typingUsers,
        onlineUsers,
        sendMessage,
        inAppNotification,
        dismissNotification,
        sendTypingStatus,
        fetchAllUsers,
        pinnedUserIds,
        togglePinUser,
        archivedUserIds,
        toggleArchiveUser,
        blockedUserIds,
        toggleBlockUser,
        groupsList,
        createGroup,
        deleteChat,
        deleteGroup,
        leaveGroup,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
export const useChat = () => useContext(ChatContext);
