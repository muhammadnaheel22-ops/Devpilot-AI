import {
  aiRequestSchema,
  authenticateRequest,
  getDefaultOpenRouterModel,
  listOpenRouterModels,
  recordAiRequest,
  streamOpenRouter,
} from '../../server/backend.mjs';

export default async (request) => {
  if (request.method === 'GET') {
    try {
      return Response.json({
        models: await listOpenRouterModels(),
        defaultModel: getDefaultOpenRouterModel(),
      });
    } catch (error) {
      return Response.json({ message: error.message }, { status: error.status || 500 });
    }
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method not allowed.' }), { status: 405 });
  }
  const parsed = aiRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ message: 'Invalid request.', issues: parsed.error.issues }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  let user = null;
  try {
    user = await authenticateRequest(request, { required: process.env.REQUIRE_AUTH === 'true' });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: error.status || 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const startedAt = Date.now();
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const result = await streamOpenRouter({
          ...parsed.data,
          signal: request.signal,
          onText: (text) =>
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)),
        });
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, model: result.model })}\n\n`),
        );
        await recordAiRequest({
          uid: user?.uid || 'anonymous',
          email: user?.email || null,
          mode: parsed.data.mode,
          language: parsed.data.language,
          model: result.model,
          status: 'success',
          outputCharacters: result.outputCharacters,
          durationMs: Date.now() - startedAt,
        });
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
};
