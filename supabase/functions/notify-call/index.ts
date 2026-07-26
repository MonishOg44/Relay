// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

// Set VAPID details
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
const VAPID_SUBJECT = 'mailto:admin@relay.com'; 

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

serve(async (req) => {
  // CORS Headers for client invocation
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_DB_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      throw new Error('Missing VAPID keys in environment');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    const { targetId, callerName, callerId, isVideo } = payload;

    if (!targetId || !callerName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: corsHeaders });
    }

    // Get receiver's push subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', targetId);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No active push subscriptions for user" }), { status: 200, headers: corsHeaders });
    }

    const notificationPayload = JSON.stringify({
      title: `Incoming ${isVideo ? 'Video' : 'Voice'} Call`,
      body: `${callerName} is calling you...`,
      data: {
        chatId: callerId || null, 
        url: '/' 
      }
    });

    const pushPromises = subscriptions.map(async (subRecord) => {
      try {
        await webpush.sendNotification(subRecord.subscription, notificationPayload);
      } catch (err) {
        console.error('Error sending push notification to a device:', err);
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .match({ subscription: subRecord.subscription });
        }
      }
    });

    await Promise.all(pushPromises);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error('Webhook processing error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
