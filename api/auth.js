import {
  clearSessionCookie,
  getSessionUser,
  loginAccount,
  logoutAccount,
  registerAccount,
  sessionCookie,
  updateAccountProfile,
} from '../server/auth.mjs';

export default async function handler(req, res) {
  const action = req.query.action;
  try {
    if (action === 'session' && req.method === 'GET') {
      return res.json({ user: await getSessionUser(req) });
    }
    if (action === 'register' && req.method === 'POST') {
      const result = await registerAccount(req.body);
      res.setHeader('Set-Cookie', sessionCookie(result.token));
      return res.status(201).json({ user: result.user });
    }
    if (action === 'login' && req.method === 'POST') {
      const result = await loginAccount(req.body);
      res.setHeader('Set-Cookie', sessionCookie(result.token));
      return res.json({ user: result.user });
    }
    if (action === 'logout' && req.method === 'POST') {
      await logoutAccount(req);
      res.setHeader('Set-Cookie', clearSessionCookie());
      return res.json({ ok: true });
    }
    if (action === 'profile' && req.method === 'PATCH') {
      return res.json({ user: await updateAccountProfile(req, req.body) });
    }
    return res.status(405).json({ message: 'Method not allowed.' });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ message: error.message || 'Authentication failed.' });
  }
}
