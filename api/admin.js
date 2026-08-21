import { authenticateRequest, getAdminOverview } from '../server/backend.mjs';
import { publicErrorMessage } from '../server/errors.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed.' });
  try {
    await authenticateRequest(req, { admin: true });
    return res.json(await getAdminOverview());
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ message: publicErrorMessage(error, 'Admin request failed.') });
  }
}
