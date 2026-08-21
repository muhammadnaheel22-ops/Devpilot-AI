import { authenticateRequest, getAdminOverview } from '../../server/backend.mjs';
import { publicErrorMessage } from '../../server/errors.mjs';

export default async (request) => {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ message: 'Method not allowed.' }), { status: 405 });
  }
  try {
    await authenticateRequest(request, { admin: true });
    return Response.json(await getAdminOverview());
  } catch (error) {
    return Response.json(
      { message: publicErrorMessage(error, 'Admin request failed.') },
      { status: error.status || 500 },
    );
  }
};
