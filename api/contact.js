// Vercel serverless function: receives the "Get in touch" form and emails it via Resend (https://resend.com).
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY   API key from resend.com
//   CONTACT_TO       Where messages are delivered, e.g. office@cobalt.az
//   CONTACT_FROM     Verified sender, e.g. "Cobalt website <website@cobalt.az>"
//                    (until a domain is verified in Resend, use "onboarding@resend.dev")

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const raw = typeof req.body === 'string' ? req.body : '';
  const type = req.headers['content-type'] || '';
  if (type.includes('application/json')) return JSON.parse(raw || '{}');
  return Object.fromEntries(new URLSearchParams(raw));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const wantsJson = (req.headers.accept || '').includes('application/json');
  const reply = (status, payload) =>
    wantsJson ? res.status(status).json(payload) : res.redirect(303, status < 300 ? '/get-in-touch?sent=1' : '/get-in-touch?error=1');

  let body;
  try {
    body = await readBody(req);
  } catch {
    return reply(400, { error: 'Invalid body' });
  }

  // Honeypot field: real visitors never fill it in.
  if (body.website) return reply(200, { ok: true });

  const email = String(body.email || '').trim().slice(0, 256);
  const subject = String(body.subject || '').trim().slice(0, 256);
  const message = String(body.message || '').trim().slice(0, 5000);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !subject || !message) {
    return reply(400, { error: 'Please fill in all fields with a valid e-mail.' });
  }

  const { RESEND_API_KEY, CONTACT_TO, CONTACT_FROM } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO) {
    console.error('Contact form is not configured: set RESEND_API_KEY and CONTACT_TO');
    return reply(500, { error: 'Contact form is not configured' });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: CONTACT_FROM || 'Cobalt website <onboarding@resend.dev>',
      to: CONTACT_TO.split(',').map((s) => s.trim()),
      reply_to: email,
      subject: `[cobalt.az] ${subject}`,
      text: `From: ${email}\nSubject: ${subject}\n\n${message}`,
      html: `<p><b>From:</b> ${escape(email)}<br><b>Subject:</b> ${escape(subject)}</p><p>${escape(message).replace(/\n/g, '<br>')}</p>`,
    }),
  });

  if (!response.ok) {
    console.error('Resend error', response.status, await response.text());
    return reply(502, { error: 'Could not send message' });
  }
  return reply(200, { ok: true });
}
