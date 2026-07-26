import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext();

const STORAGE_KEY_USER = 'relay_user_session';
const STORAGE_KEY_PROFILE = 'relay_user_profile';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (mounted) {
            if (session?.user) {
              setUser(session.user);
              localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(session.user));
              await fetchProfile(session.user.id, session.user.user_metadata);
            } else {
              // If Supabase has no active session, clear storage
              const savedUser = localStorage.getItem(STORAGE_KEY_USER);
              if (!savedUser) {
                setUser(null);
                setProfile(null);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error initializing auth session:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          localStorage.removeItem(STORAGE_KEY_USER);
          localStorage.removeItem(STORAGE_KEY_PROFILE);
        } else if (session?.user) {
          setUser(session.user);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(session.user));
          await fetchProfile(session.user.id, session.user.user_metadata);
        }
        setLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (userId, userMetadata = null) => {
    try {
      if (!supabase) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setProfile(data);
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(data));
        return data;
      } else if (userMetadata) {
        const fallback = {
          id: userId,
          username: userMetadata.username || userMetadata.email?.split('@')[0] || 'User',
          email: userMetadata.email || '',
          avatar_url: userMetadata.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
          banner_url: null,
          status_message: 'Hey there! I am using Relay.',
        };
        setProfile(fallback);
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(fallback));
        return fallback;
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      const cached = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (cached) {
        try {
          setProfile(JSON.parse(cached));
        } catch (e) {}
      }
    }
  };

  const updateProfile = async ({ username, status_message, avatar_url, banner_url, privacy_last_seen, privacy_profile_picture }) => {
    if (!profile || !supabase) return;

    const updates = {
      username: username ?? profile.username,
      status_message: status_message ?? profile.status_message,
      avatar_url: avatar_url ?? profile.avatar_url,
      banner_url: banner_url ?? profile.banner_url,
      privacy_last_seen: privacy_last_seen ?? profile.privacy_last_seen,
      privacy_profile_picture: privacy_profile_picture ?? profile.privacy_profile_picture,
      last_seen: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();

    const updatedProfile = data || { ...profile, ...updates };
    setProfile(updatedProfile);
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updatedProfile));

    if (error && !data) throw error;
    return updatedProfile;
  };

  const updatePassword = async (newPassword) => {
    if (!supabase) return;
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  };

  const deleteAccount = async () => {
    if (!profile || !supabase) return;

    try {
      const { data, error } = await supabase.functions.invoke('delete-account');
      
      if (error) {
        console.error('Edge Function Error:', error);
        throw error;
      }

      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error deleting account:', err);
    } finally {
      setUser(null);
      setProfile(null);
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_PROFILE);
    }
  };

  const resetPassword = async (email) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not connected!');
    }

    let targetEmail = email.trim();
    if (!targetEmail.includes('@')) {
      const { data: foundEmail } = await supabase.rpc('get_email_by_username', {
        p_username: targetEmail,
      });
      if (foundEmail) targetEmail = foundEmail;
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
    return data;
  };

  const login = async (identifier, password) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not connected!');
    }

    let targetEmail = identifier.trim();

    if (!targetEmail.includes('@')) {
      const { data: foundEmail, error: rpcErr } = await supabase.rpc('get_email_by_username', {
        p_username: targetEmail,
      });

      if (rpcErr || !foundEmail) {
        throw new Error('No user account found with that username.');
      }
      targetEmail = foundEmail;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

    if (error) throw error;

    if (data?.user) {
      setUser(data.user);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
      await fetchProfile(data.user.id, data.user.user_metadata);
    }

    return data;
  };

  const signup = async (email, password, username, avatarUrl) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not connected!');
    }

    const { data: existingEmail } = await supabase.rpc('get_email_by_username', {
      p_username: username.trim(),
    });

    if (existingEmail) {
      throw new Error('Username is already taken. Please choose another username!');
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: username.trim(),
          avatar_url: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username.trim()}`,
        },
      },
    });
    if (error) throw error;

    let resData = data;
    if (!data.session) {
      const signInRes = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInRes.error) throw signInRes.error;
      resData = signInRes.data;
    }

    if (resData?.user) {
      setUser(resData.user);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(resData.user));
      await fetchProfile(resData.user.id, resData.user.user_metadata);
    }

    return resData;
  };

  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Sign out error:', e);
      }
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_PROFILE);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isConfigured: isSupabaseConfigured,
        login,
        signup,
        logout,
        updateProfile,
        updatePassword,
        deleteAccount,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
