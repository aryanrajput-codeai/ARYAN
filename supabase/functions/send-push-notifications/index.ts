// Supabase Edge Function: send-push-notifications
// Deno TypeScript runtime
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch active registered devices
    const { data: devices, error: devError } = await supabase
      .from('user_devices')
      .select('expo_push_token')
      .eq('is_active', true);

    if (devError || !devices || devices.length === 0) {
      return new Response(JSON.stringify({ message: 'No registered push devices found.' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const tokens = devices.map((d) => d.expo_push_token);

    // 2. Query upcoming renewals (expiring in <= 30 days)
    const today = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(today.getDate() + 30);

    const todayStr = today.toISOString().substring(0, 10);
    const thirtyDaysStr = thirtyDaysAhead.toISOString().substring(0, 10);

    const { data: upcomingSubs, error: subError } = await supabase
      .from('subscriptions')
      .select('id, end_date, amount, client:clients(business_name), product:products(name)')
      .gte('end_date', todayStr)
      .lte('end_date', thirtyDaysStr)
      .eq('status', 'ACTIVE');

    if (subError) throw subError;

    // 3. Build Expo push messages
    const messages = [];

    for (const sub of upcomingSubs || []) {
      const clientName = (sub.client as any)?.business_name || 'Client';
      const productName = (sub.product as any)?.name || 'WebRajya SaaS';

      for (const token of tokens) {
        messages.push({
          to: token,
          sound: 'default',
          title: 'Subscription Renewal Alert',
          body: `${clientName}'s ${productName} subscription expires on ${sub.end_date}. Tap to review and renew.`,
          data: { subscriptionId: sub.id, type: 'RENEWAL_DUE' },
        });
      }
    }

    // 4. Send batches to Expo Push API
    if (messages.length > 0) {
      const expoRes = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const expoData = await expoRes.json();
      return new Response(JSON.stringify({ success: true, sent: messages.length, expoData }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'No urgent renewals pending push notifications.' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
