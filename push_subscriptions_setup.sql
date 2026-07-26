-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Unique index on the endpoint to prevent duplicate subscriptions for the same device
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_idx ON public.push_subscriptions ((subscription->>'endpoint'));

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own subscriptions"
ON public.push_subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
ON public.push_subscriptions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Edge functions (service_role) need to be able to read and delete subscriptions
CREATE POLICY "Service role can read all subscriptions"
ON public.push_subscriptions FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role can delete all subscriptions"
ON public.push_subscriptions FOR DELETE
TO service_role
USING (true);
