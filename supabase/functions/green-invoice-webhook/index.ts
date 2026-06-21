import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const payload = await req.json();

  // TODO: verify the exact event name and payload shape from Green Invoice
  // Likely: { event: 'document.paid', documentId: '...', ... }
  // or:     { status: 'paid', id: '...', ... }
  const documentId = payload.id ?? payload.documentId;
  const isPaid = payload.event === 'document.paid'
    || payload.status === 'paid'
    || payload.event === 'payment.completed';

  if (!isPaid || !documentId) {
    return new Response('Ignored', { status: 200 });
  }

  // Find the payment record by green_invoice_id and mark it paid
  const { error } = await supabase
    .from('payments')
    .update({ method: 'paid' })
    .eq('green_invoice_id', documentId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
