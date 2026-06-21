import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Green Invoice API base URL — switch to sandbox for testing
const GI_BASE = Deno.env.get('GREENINVOICE_SANDBOX') === 'true'
  ? 'https://sandbox.d.greeninvoice.co.il/api/v1'
  : 'https://api.greeninvoice.co.il/api/v1';

// Green Invoice: exchange API key for a short-lived JWT
async function getGreenInvoiceToken(): Promise<string> {
  const res = await fetch(`${GI_BASE}/account/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: Deno.env.get('GREENINVOICE_ID'),
      secret: Deno.env.get('GREENINVOICE_SECRET'),
    }),
  });
  const data = await res.json();
  // TODO: confirm exact field name — likely `token` or `jwt`
  return data.token ?? data.jwt;
}

// Green Invoice: create a payment request document and return the payment URL
// TODO: Once real credentials are available, verify the exact request body shape
// against https://greeninvoice.docs.apiary.io (Add Document endpoint).
async function createGreenInvoicePaymentLink(opts: {
  clientName: string;
  clientEmail?: string;
  amountILS: number;
  description: string;
  webhookUrl: string;
}): Promise<{ paymentUrl: string; documentId: string }> {
  const token = await getGreenInvoiceToken();

  // Document type 400 = "payment request" (בקשת תשלום).
  // If 400 is not the correct type, change to the type that creates an online payment page.
  // The `paymentPage` flag (or similar) tells Green Invoice to host a payment form.
  const body = {
    type: 400,
    lang: 'he',
    currency: 'ILS',
    vatType: 0, // 0 = no VAT included (price is VAT-inclusive)
    client: {
      name: opts.clientName,
      ...(opts.clientEmail ? { emails: [opts.clientEmail] } : {}),
    },
    income: [
      {
        description: opts.description,
        price: opts.amountILS,
        quantity: 1,
        vatType: 0,
      },
    ],
    payment: [
      {
        type: 10, // 10 = credit card (כרטיס אשראי)
        price: opts.amountILS,
        currency: 'ILS',
      },
    ],
    // Notify us when payment is completed
    // TODO: verify the exact callback field name in the Green Invoice API
    callback: opts.webhookUrl,
  };

  const res = await fetch(`${GI_BASE}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Green Invoice error: ${JSON.stringify(data)}`);
  }

  // TODO: verify exact field names in the response
  // Common candidates: data.url, data.paymentUrl, data.shareLink
  const paymentUrl = data.url ?? data.paymentUrl ?? data.shareLink;
  const documentId = data.id;

  return { paymentUrl, documentId };
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verify the caller is authenticated
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { bookingId } = await req.json();
  if (!bookingId) return new Response('Missing bookingId', { status: 400 });

  // Fetch booking → class → instructor → client
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id, client_id,
      classes!inner(id, title, instructor_id, profiles!instructor_id(id, role)),
      profiles!client_id(display_name, push_token)
    `)
    .eq('id', bookingId)
    .single();

  if (!booking) return new Response('Booking not found', { status: 404 });

  const cls = (booking as any).classes;
  const instructor = cls.profiles;
  const client = (booking as any).profiles;

  let paymentUrl: string | null = null;
  let greenInvoiceId: string | null = null;

  // Only create a Green Invoice payment link for owner-taught lessons
  if (instructor.role === 'owner') {
    const giEnabled = Deno.env.get('GREENINVOICE_ID') && Deno.env.get('GREENINVOICE_SECRET');

    if (giEnabled) {
      const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/green-invoice-webhook`;
      const result = await createGreenInvoicePaymentLink({
        clientName: client.display_name,
        amountILS: 0, // TODO: amount should come from the booking/class — add a `price` field to classes
        description: cls.title,
        webhookUrl,
      });
      paymentUrl = result.paymentUrl;
      greenInvoiceId = result.documentId;
    } else {
      // Placeholder URL shown in the WebView until real credentials are configured
      paymentUrl = `https://placeholder.payment/${bookingId}`;
    }

    // Store the Green Invoice document ID and payment URL on the payment record
    await supabase
      .from('payments')
      .update({
        green_invoice_id: greenInvoiceId ?? `placeholder_${bookingId}`,
        payment_url: paymentUrl,
      })
      .eq('booking_id', bookingId);
  }

  // Send push notification to the client
  const clientToken = client.push_token;
  if (clientToken) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: clientToken,
        title: 'בקשת תשלום',
        body: `נשלחה עליך בקשת תשלום עבור "${cls.title}"`,
        data: { screen: 'pay', bookingId },
        sound: 'default',
      }),
    });
  }

  return new Response(JSON.stringify({ ok: true, paymentUrl }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
