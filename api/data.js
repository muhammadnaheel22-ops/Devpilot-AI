import { authenticateRequest } from '../server/backend.mjs';
import { runDataOperation } from '../server/data-api.mjs';

export default async function handler(req, res) {
  try {
    const user = await authenticateRequest(req, { required: true });
    const result = await runDataOperation({
      method: req.method,
      resource: req.query.resource,
      id: req.query.id,
      body: req.body,
      user,
    });
    return res.json(result);
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || 'Data request failed.',
      ...(error.issues ? { issues: error.issues } : {}),
    });
  }
}
