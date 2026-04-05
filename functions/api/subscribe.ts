// Cloudflare Pages Function: POST /api/subscribe
// Stores email subscribers in KV namespace binding `SUBSCRIBERS`.
// Binding is created via the Cloudflare dashboard or wrangler during deploy.

interface Env {
  SUBSCRIBERS?: KVNamespace;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let email = '';
    let source = 'unknown';

    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { email?: string; source?: string };
      email = (body.email || '').trim().toLowerCase();
      source = (body.source || 'unknown').slice(0, 32);
    } else {
      const form = await request.formData();
      email = String(form.get('email') || '').trim().toLowerCase();
      source = String(form.get('source') || 'unknown').slice(0, 32);
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

    if (env.SUBSCRIBERS) {
      // idempotent upsert keyed by email
      await env.SUBSCRIBERS.put(`sub:${email}`, JSON.stringify(record));
    } else {
      // no KV bound yet — log for visibility in Pages Function logs
      console.log('subscribe (no KV):', JSON.stringify(record));
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
