import {
  clearSessionCookie,
  getSessionUser,
  loginAccount,
  logoutAccount,
  registerAccount,
  sessionCookie,
  updateAccountProfile,
} from '../../server/auth.mjs';
import { publicErrorMessage } from '../../server/errors.mjs';

const json = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });

export default async (request) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || url.pathname.split('/').filter(Boolean).at(-1);
  try {
    if (action === 'session' && request.method === 'GET') {
      return json({ user: await getSessionUser(request) });
    }
    if (action === 'register' && request.method === 'POST') {
      const result = await registerAccount(await request.json().catch(() => null));
      return json(
        { user: result.user },
        { status: 201, headers: { 'Set-Cookie': sessionCookie(result.token) } },
      );
    }
    if (action === 'login' && request.method === 'POST') {
      const result = await loginAccount(await request.json().catch(() => null));
      return json(
        { user: result.user },
        { headers: { 'Set-Cookie': sessionCookie(result.token) } },
      );
    }
    if (action === 'logout' && request.method === 'POST') {
      await logoutAccount(request);
      return json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } });
    }
    if (action === 'profile' && request.method === 'PATCH') {
      return json({
        user: await updateAccountProfile(request, await request.json().catch(() => null)),
      });
    }
    return json({ message: 'Method not allowed.' }, { status: 405 });
  } catch (error) {
    return json(
      { message: publicErrorMessage(error, 'Authentication service is temporarily unavailable.') },
      { status: error.status || 500 },
    );
  }
};
