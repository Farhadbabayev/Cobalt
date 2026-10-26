// GitHub OAuth for the Decap CMS admin panel (/admin), step 1: send the editor to GitHub.
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   GITHUB_CLIENT_ID      from a GitHub OAuth App (github.com/settings/developers)
//   GITHUB_CLIENT_SECRET  from the same app
// The OAuth App's "Authorization callback URL" must be https://<your-domain>/api/callback
import { randomBytes } from 'node:crypto';

export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return res.status(500).send('GITHUB_CLIENT_ID is not set');

  const state = randomBytes(16).toString('hex');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `https://${host}/api/callback`,
    scope: 'repo,user',
    state,
  });

  res.setHeader('Set-Cookie', `decap_oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  res.redirect(302, `https://github.com/login/oauth/authorize?${params}`);
}
