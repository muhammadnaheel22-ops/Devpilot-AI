import { appEnv } from '../config/env';

export async function getAdminOverview(token) {
  const response = await fetch(`${appEnv.apiBaseUrl}/admin/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Unable to load admin data.');
  return payload;
}
