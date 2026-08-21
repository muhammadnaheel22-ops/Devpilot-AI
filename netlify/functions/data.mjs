import { authenticateRequest } from '../../server/backend.mjs';
import { runDataOperation } from '../../server/data-api.mjs';
import { publicErrorMessage } from '../../server/errors.mjs';

export default async (request) => {
  const url = new URL(request.url);
  const path = (url.searchParams.get('path') || '').split('/').filter(Boolean);
  const [resource, id] = path;
  try {
    const user = await authenticateRequest(request, { required: true });
    const result = await runDataOperation({
      method: request.method,
      resource,
      id,
      body: request.method === 'POST' ? await request.json().catch(() => null) : undefined,
      user,
    });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        message: publicErrorMessage(error, 'Database request failed.'),
        ...(error.issues ? { issues: error.issues } : {}),
      },
      { status: error.status || 500 },
    );
  }
};
