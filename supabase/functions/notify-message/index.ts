// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";

// Set VAPID details
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
const VAPID_SUBJECT = 'mailto:admin@relay.com'; // Replace with a real email if needed

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

serve(async (req) => {
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

    // Parse the webhook payload
    const payload = await req.json();
    
    // We only care about inserts on messages or pending friendships
    if (payload.type !== 'INSERT' || !['messages', 'friendships'].includes(payload.table)) {
      return new Response(JSON.stringify({ message: "Ignored event type or table" }), { status: 200 });
    }

    const record = payload.record;
    
    if (payload.table === 'friendships' && record.status !== 'pending') {
      return new Response(JSON.stringify({ message: "Not a pending friend request" }), { status: 200 });
    }

    const senderId = payload.table === 'messages' ? record.sender_id : record.requester_id;
    const receiverId = record.receiver_id;
    
    // 1. Get sender's details
    const { data: sender } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', senderId)
      .single();

    const senderName = sender?.username || 'Someone';

    // 2. Get receiver's push subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', receiverId);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No active push subscriptions for user" }), { status: 200 });
    }

    // 3. Prepare notification payload
    let title, body;
    if (payload.table === 'messages') {
      title = `New message from ${senderName}`;
      body = record.content || 'Sent an attachment';
    } else {
      title = `New friend request`;
      body = `${senderName} wants to be friends on Relay!`;
    }

    const notificationPayload = JSON.stringify({
      title,
      body,
      data: {
        chatId: senderId, // Useful for clicking the notification to open the specific chat or profile
        url: '/' 
      }
    });

    const pushPromises = subscriptions.map(async (subRecord) => {
      try {
        await webpush.sendNotification(subRecord.subscription, notificationPayload);
      } catch (err) {
        console.error('Error sending push notification to a device:', err);
        // If the subscription is invalid/expired (status 410 or 404), we should ideally delete it from the DB
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .match({ subscription: subRecord.subscription });
        }
      }
    });

    await Promise.all(pushPromises);

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    console.error('Webhook processing error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
