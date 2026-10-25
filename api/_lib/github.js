const crypto = require('crypto');

const COOKIE_NAME = 'deccan_admin_session';
function config() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH || 'main';
  if (!owner || !repo || !token) throw new Error('GitHub configuration missing. Set GITHUB_OWNER, GITHUB_REPO and GITHUB_TOKEN in Vercel.');
  if (!process.env.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD is not configured in Vercel.');
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters long.');
  return { owner, repo, token, branch };
}
function sign(value) { return crypto.createHmac('sha256', process.env.SESSION_SECRET).update(value).digest('base64url'); }
function makeSession(username) {
  const payload = Buffer.from(JSON.stringify({ username, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
  return payload + '.' + sign(payload);
}
function validSession(req) {
  const cookies = (req.headers.cookie || '').split(';').map(x => x.trim());
  const entry = cookies.find(x => x.startsWith(COOKIE_NAME + '='));
  if (!entry) return false;
  const token = decodeURIComponent(entry.slice(COOKIE_NAME.length + 1));
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const expected = Buffer.from(sign(parts[0]));
  const got = Buffer.from(parts[1]);
  if (expected.length !== got.length || !crypto.timingSafeEqual(expected, got)) return false;
  try { const data = JSON.parse(Buffer.from(parts[0], 'base64url').toString()); return data.exp > Date.now() && data.username === (process.env.ADMIN_USERNAME || 'admin'); } catch { return false; }
}
function requireSession(req, res) {
  if (!validSession(req)) { res.status(401).json({ error: 'Please sign in again.' }); return false; }
  return true;
}
function cookie(value, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; Path=/api/admin; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}
async function githubRequest(path, options = {}) {
  const c = config();
  const url = `https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(c.branch)}`;
  const response = await fetch(url, { method: options.method || 'GET', headers: { 'Authorization': `Bearer ${c.token}`, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'deccan-community-admin', ...(options.body ? {'Content-Type':'application/json'} : {}) }, ...(options.body ? {body: JSON.stringify(options.body)} : {}) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404) throw new Error(`GitHub file not found: ${path}. Ensure content.json exists on branch ${c.branch}.`);
    if (response.status === 409 || response.status === 422) throw new Error('GitHub rejected this update (possibly a simultaneous change). Reload the admin panel and try again.');
    if (response.status === 401 || response.status === 403) throw new Error('GitHub rejected the token. Check GITHUB_TOKEN permissions and repository access.');
    throw new Error(data.message || `GitHub API error (${response.status}).`);
  }
  return data;
}
async function getContentFile() {
  const file = await githubRequest('content.json');
  return { content: JSON.parse(Buffer.from(file.content.replace(/\n/g, ''), 'base64').toString('utf8')), sha: file.sha };
}
async function putFile(path, content, sha, message, encoding = 'utf8') {
  const c = config();
  const bodyContent = encoding === 'base64' ? content : Buffer.from(content, 'utf8').toString('base64');
  const url = `https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
  const response = await fetch(url, { method:'PUT', headers:{'Authorization':`Bearer ${c.token}`,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'deccan-community-admin','Content-Type':'application/json'}, body:JSON.stringify({message,content:bodyContent,branch:c.branch,...(sha?{sha}:{})}) });
  const data = await response.json().catch(()=>({}));
  if (!response.ok) {
    if (response.status === 409 || response.status === 422) throw new Error('GitHub could not publish because the file changed at the same time. Reload the admin panel and retry.');
    if (response.status === 401 || response.status === 403) throw new Error('GitHub rejected the token. Check its Contents: Read and write permission.');
    throw new Error(data.message || `Could not commit file to GitHub (${response.status}).`);
  }
  return data;
}
module.exports = { config, makeSession, validSession, requireSession, cookie, COOKIE_NAME, getContentFile, putFile };
