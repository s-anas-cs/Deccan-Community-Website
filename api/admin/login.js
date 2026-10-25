const { makeSession, cookie } = require('../_lib/github');
const crypto = require('crypto');
function safeEqual(a,b){const x=Buffer.from(String(a||''));const y=Buffer.from(String(b||''));return x.length===y.length&&crypto.timingSafeEqual(x,y)}
module.exports = async (req,res) => {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed.'});
  try {
    const username = String(req.body?.username || '');
    const password = String(req.body?.password || '');
    if (!safeEqual(username, process.env.ADMIN_USERNAME || 'admin') || !safeEqual(password, process.env.ADMIN_PASSWORD || '')) return res.status(401).json({error:'Incorrect username or password.'});
    // Force configuration validation before creating a session.
    require('../_lib/github').config();
    res.setHeader('Set-Cookie', cookie(makeSession(username), 8*60*60));
    return res.status(200).json({message:'Signed in successfully.'});
  } catch (e) { return res.status(500).json({error:e.message || 'Server configuration error.'}); }
};
