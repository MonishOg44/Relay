-- =========================================================
-- SUPABASE REAL-TIME CHAT SECURITY HARDENED SCHEMA & SETUP
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard)
-- =========================================================

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL CHECK (length(username) >= 2 AND length(username) <= 32),
  email TEXT NOT NULL,
  avatar_url TEXT,
  status_message TEXT DEFAULT 'Hey there! I am using Relay.' CHECK (length(status_message) <= 140),
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Messages Table with Constraints (Max 4000 chars)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 4000),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_different_users CHECK (sender_id <> receiver_id)
);

-- Indexes for maximum query performance & indexing
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- 3. Revoke all privileges from public/anon role
REVOKE ALL ON public.profiles FROM anon, public;
REVOKE ALL ON public.messages FROM anon, public;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. Strict Profiles RLS Policies
DROP POLICY IF EXISTS "Public profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Public profiles viewable by authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6. Airtight Messages RLS Policies
DROP POLICY IF EXISTS "Strict message read policy" ON public.messages;
CREATE POLICY "Strict message read policy"
  ON public.messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Strict message insert policy" ON public.messages;
CREATE POLICY "Strict message insert policy"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Strict message update read receipt policy" ON public.messages;
CREATE POLICY "Strict message update read receipt policy"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- 7. Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Enable Realtime on tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- =========================================================
-- 9. Push Notifications Subscriptions
-- =========================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subscription)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- 10. Supabase Storage for Chat Media
-- =========================================================
-- Insert the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to upload media
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-media');

-- Allow anyone to view media (since it's public)
DROP POLICY IF EXISTS "Anyone can view media" ON storage.objects;
CREATE POLICY "Anyone can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-media');

-- Allow users to delete their own media
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-media' AND (auth.uid() = owner));

-- =========================================================
-- 11. Friendships & Privacy Engine
-- =========================================================

-- Add Privacy Columns to Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_last_seen TEXT DEFAULT 'friends' CHECK (privacy_last_seen IN ('everyone', 'friends', 'nobody'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_profile_picture TEXT DEFAULT 'friends' CHECK (privacy_profile_picture IN ('everyone', 'friends', 'nobody'));

-- Create Friendships Table
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_different_users CHECK (requester_id <> receiver_id),
  UNIQUE(requester_id, receiver_id)
);

-- Enable RLS on Friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can view their own friendships
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
CREATE POLICY "Users can view own friendships"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Users can send friend requests (insert where they are requester)
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Users can accept/decline friend requests (update/delete where they are receiver)
-- They can also cancel their own requests (delete where they are requester)
DROP POLICY IF EXISTS "Users can update received requests" ON public.friendships;
CREATE POLICY "Users can update received requests"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete requests" ON public.friendships;
CREATE POLICY "Users can delete requests"
  ON public.friendships FOR DELETE
  TO authenticated
  USING (auth.uid() = receiver_id OR auth.uid() = requester_id);

-- Add Realtime to Friendships
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;

-- =========================================================
-- 12. Feature Waitlists
-- =========================================================

CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature)
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert themselves" ON public.waitlist;
CREATE POLICY "Users can insert themselves" ON public.waitlist
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their waitlist status" ON public.waitlist;
CREATE POLICY "Users can view their waitlist status" ON public.waitlist
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- =========================================================
-- 13. User Daily Usage (Screen Time — backend stored)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.user_daily_usage (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid    REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date        date    NOT NULL DEFAULT CURRENT_DATE,
  screen_time_seconds integer DEFAULT 0,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.user_daily_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own usage" ON public.user_daily_usage;
CREATE POLICY "Users can manage own usage" ON public.user_daily_usage
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- 14. Calendar Events (Scheduled Calls & Meetings)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id             uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid    REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title          text    NOT NULL,
  date_str       date    NOT NULL,
  time_str       text    NOT NULL,
  duration_str   text    NOT NULL,
  event_type     text    NOT NULL,
  host_name      text    NOT NULL,
  contact_id     uuid    REFERENCES public.profiles(id) ON DELETE SET NULL,
  contact_name   text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own calendar events" ON public.calendar_events;
CREATE POLICY "Users can manage own calendar events" ON public.calendar_events
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
