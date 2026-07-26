import React, { useState } from 'react';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '../../lib/supabaseClient';
import { Database, Check, Copy, X } from 'lucide-react';

const SQL_SCRIPT = `-- Run this in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL, email TEXT NOT NULL,
  avatar_url TEXT, status_message TEXT DEFAULT 'Hey!',
  is_online BOOLEAN DEFAULT false, last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL, is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "messages_select" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN INSERT INTO public.profiles (id, username, email, avatar_url) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), NEW.email, 'https://api.dicebear.com/7.x/bottts/svg?seed=' || NEW.id); RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;`;

export default function ConfigModal({ onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-card animate-fade-in-up" style={{ maxWidth: '500px' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--icon-default)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(0, 168, 132, 0.12)', color: '#00a884' }}>
            <Database size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Pure Supabase Backend</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {isSupabaseConfigured ? '🟢 Connected via .env' : '🔴 Add keys to .env to connect'}
            </p>
          </div>
        </div>

        <div style={{ background: 'var(--bg-header)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Backend Environment Configuration</div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
            To connect to Supabase, paste your credentials in your project's <code style={{ color: '#00a884', background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px' }}>.env</code> file:
          </p>
          <pre style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: '6px', fontSize: '11px', color: 'var(--text-primary)', overflowX: 'auto', fontFamily: 'monospace' }}>
{`VITE_SUPABASE_URL=${SUPABASE_URL || 'https://your-project.supabase.co'}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY ? '••••••••' : 'your-anon-key'}`}
          </pre>
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.5px' }}>SQL SETUP SCRIPT</span>
          <button onClick={handleCopySql}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,168,132,0.12)', border: '1px solid rgba(0,168,132,0.25)', color: '#00a884', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy SQL'}
          </button>
        </div>
      </div>
    </div>
  );
}
