const path = require('path');
const { requireSession, putFile } = require('../_lib/github');
const crypto = require('crypto');
const ALLOWED = new Set(['image/jpeg','image/png','image/webp','image/gif']);
module.exports = async (req,res) => {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed.'});
  if(!requireSession(req,res)) return;
  try {
    const {name,mimeType,data} = req.body || {};
    if(!ALLOWED.has(mimeType)) return res.status(400).json({error:'Please upload a JPG, PNG, WEBP or GIF image.'});
    if(typeof data!=='string' || !data.length) return res.status(400).json({error:'No image data received.'});
    const bytes=Buffer.from(data,'base64');
    if(bytes.length>3*1024*1024) return res.status(413).json({error:'Image must be 3 MB or smaller.'});
    const ext=({ 'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif'})[mimeType];
    const base=path.basename(String(name||'image'),path.extname(String(name||''))).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,45)||'image';
    const rel=`uploads/${Date.now()}-${crypto.randomBytes(3).toString('hex')}-${base}${ext}`;
    await putFile(rel,bytes.toString('base64'),null,`Upload website image ${path.basename(rel)}`,'base64');
    return res.status(200).json({path:rel,message:'Image uploaded to GitHub.'});
  } catch(e) { return res.status(500).json({error:e.message || 'Could not upload image.'}); }
};
