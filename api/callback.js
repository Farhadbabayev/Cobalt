// GitHub OAuth for the Decap CMS admin panel (/admin), step 2: exchange the code for a token
// and hand it to the admin window using the postMessage handshake Decap CMS expects.

function page(status, content) {
  const message = `authorization:github:${status}:${JSON.stringify(content)}`;
  return `<!doctype html><html><body><script>
(function () {
  function receive(e) {
    window.opener.postMessage(${JSON.stringify(message)}, e.origin);
    window.removeEventListener('message', receive, false);
  }
  window.addEventListener('message', receive, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script></body></html>`;
}

export default async function handler(req, res) {
  const { code, state } = req.query;
  const cookieState = /(?:^|;\s*)decap_oauth_state=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Set-Cookie', 'decap_oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0');

  if (!code || !state || state !== cookieState) {
    return res.status(400).send(page('error', { message: 'Invalid OAuth state, please try logging in again.' }));
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await response.json().catch(() => ({}));

  if (!data.access_token) {
    return res.status(401).send(page('error', { message: data.error_description || 'GitHub login failed' }));
  }
  res.status(200).send(page('success', { token: data.access_token, provider: 'github' }));
}
