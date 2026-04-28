// Cloudflare Pages Function: POST /api/subscribe
// Stores email subscribers in KV namespace binding `SUBSCRIBERS`.
// Binding is created via the Cloudflare dashboard or wrangler during deploy.

interface Env {
  SUBSCRIBERS?: KVNamespace;
  BEEHIIV_API_KEY?: string;
  BEEHIIV_PUBLICATION_ID?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeSource(raw: string | null | undefined): string {
  return (raw || 'unknown').trim().toLowerCase().replace(/[^a-z0-9:_-]/g, '').slice(0, 64) || 'unknown';
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let email = '';
    const querySource = sanitizeSource(new URL(request.url).searchParams.get('source'));
    let source = querySource;

    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { email?: string; source?: string };
      email = (body.email || '').trim().toLowerCase();
      source = sanitizeSource(body.source || querySource);
    } else {
      const form = await request.formData();
      email = String(form.get('email') || '').trim().toLowerCase();
      source = sanitizeSource(String(form.get('source') || querySource));
    }

    if (!email || !EMAIL_RE.test(email) || email.length > 254) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const record = {
      email,
      source,
      subscribedAt: new Date().toISOString(),
      ip: request.headers.get('cf-connecting-ip') || null,
      country: request.headers.get('cf-ipcountry') || null,
      ua: (request.headers.get('user-agent') || '').slice(0, 256),
    };

    // 1. Safety-net: store to Cloudflare KV (survives beehiiv outages/migration)
    if (env.SUBSCRIBERS) {
      await env.SUBSCRIBERS.put(`sub:${email}`, JSON.stringify(record));
    } else {
      console.log('subscribe (no KV):', JSON.stringify(record));
    }

    // 2. Forward to beehiiv for real newsletter delivery
    if (env.BEEHIIV_API_KEY && env.BEEHIIV_PUBLICATION_ID) {
      try {
        const beehiivRes = await fetch(
          `https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}/subscriptions`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.BEEHIIV_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              reactivate_existing: true,
              send_welcome_email: true,
              utm_source: 'bydfinder.com',
              utm_medium: 'web',
              utm_campaign: source,
            }),
          },
        );
        if (!beehiivRes.ok) {
          const text = await beehiivRes.text();
          console.error('beehiiv subscribe failed:', beehiivRes.status, text);
          // Non-fatal: KV still has the record. We'll retry manually if needed.
        }
      } catch (err) {
        console.error('beehiiv subscribe error:', err);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('subscribe error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};
