import { appEnv } from '../config/env';

export async function getAdminOverview() {
  const response = await fetch(`${appEnv.apiBaseUrl}/admin/overview`, {
    credentials: 'include',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Unable to load admin data.');
  return payload;
}
