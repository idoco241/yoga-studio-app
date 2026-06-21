import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async () => {
  // Find all ended classes that haven't had payment notifications sent yet
  const { data: classes, error } = await supabase
    .from('classes')
    .select('id, title, instructor_id, profiles!instructor_id(push_token)')
    .filter('payment_notified_at', 'is', null)
    .lt('scheduled_at', new Date(Date.now() - 0).toISOString()) // scheduled_at is in the past
    .filter('scheduled_at', 'lt',
      // scheduled_at + duration_minutes <= now  →  scheduled_at <= now - duration_minutes
      // We approximate by checking scheduled_at < now; exact end-time check below in JS
      new Date().toISOString()
    );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Re-fetch with duration to do the exact end-time check
  const { data: fullClasses } = await supabase
    .from('classes')
    .select('id, title, duration_minutes, scheduled_at, instructor_id, profiles!instructor_id(push_token, display_name)')
    .filter('payment_notified_at', 'is', null);

  const ended = (fullClasses ?? []).filter((c: any) => {
    const endTime = new Date(c.scheduled_at).getTime() + c.duration_minutes * 60_000;
    return endTime <= Date.now();
  });

  if (ended.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
  }

  const pushMessages: object[] = [];
  const processedIds: string[] = [];

  for (const cls of ended) {
    const token = (cls.profiles as any)?.push_token;
    processedIds.push(cls.id);

    if (token) {
      pushMessages.push({
        to: token,
        title: 'סיום שיעור',
        body: `השיעור "${cls.title}" הסתיים — נא לסמן תשלומים`,
        data: { screen: 'payment-review', classId: cls.id },
        sound: 'default',
      });
    }
  }

  // Send push notifications via Expo push service
  if (pushMessages.length > 0) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pushMessages),
    });
  }

  // Mark all processed classes
  await supabase
    .from('classes')
    .update({ payment_notified_at: new Date().toISOString() })
    .in('id', processedIds);

  return new Response(JSON.stringify({ processed: processedIds.length }), { status: 200 });
});
