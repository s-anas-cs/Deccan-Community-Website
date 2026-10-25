const { COOKIE_NAME } = require('../_lib/github');
module.exports = (req,res) => {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed.'});
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/api/admin; SameSite=Lax; Max-Age=0${secure}`);
  return res.status(200).json({message:'Signed out.'});
};
