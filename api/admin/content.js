const { requireSession, getContentFile, putFile } = require('../_lib/github');
module.exports = async (req,res) => {
  res.setHeader('Cache-Control','no-store');
  if (!['GET','POST'].includes(req.method)) return res.status(405).json({error:'Method not allowed.'});
  if (!requireSession(req,res)) return;
  try {
    if (req.method === 'GET') {
      const data = await getContentFile();
      return res.status(200).json({content:data.content});
    }
    const content = req.body?.content;
    if (!content || typeof content !== 'object' || !Array.isArray(content.services) || !Array.isArray(content.events) || !content.contact || !content.siteImages) return res.status(400).json({error:'Invalid content format.'});
    if (JSON.stringify(content).length > 400000) return res.status(413).json({error:'Content is too large.'});
    const current = await getContentFile();
    const saved = await putFile('content.json', JSON.stringify(content,null,2)+'\n', current.sha, 'Update website content via admin panel');
    return res.status(200).json({message:'Saved to GitHub. Vercel will deploy the update automatically.', commit:saved.commit?.sha || null});
  } catch(e) { return res.status(500).json({error:e.message || 'Could not save content.'}); }
};
