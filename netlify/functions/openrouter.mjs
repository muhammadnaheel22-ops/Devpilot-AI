import {
  aiRequestSchema,
  authenticateRequest,
  getDefaultOpenRouterModel,
  listOpenRouterModels,
  recordAiRequest,
  requestedModelForLog,
  streamOpenRouter,
} from '../../server/backend.mjs';
import { publicErrorMessage } from '../../server/errors.mjs';

export default async (request) => {
  if (request.method === 'GET') {
    try {
      return Response.json({
        models: await listOpenRouterModels(),
        defaultModel: getDefaultOpenRouterModel(),
        routingModes: ['auto', 'manual', 'fallback'],
        autoModel: 'openrouter/auto',
        maxFallbacks: 5,
      });
    } catch (error) {
      return Response.json(
        { message: publicErrorMessage(error, 'Unable to load AI models.') },
        { status: error.status || 500 },
      );
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
    user = await authenticateRequest(request, { required: process.env.REQUIRE_AUTH !== 'false' });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: publicErrorMessage(error, 'Authentication failed.') }),
      {
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
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
          encoder.encode(
            `data: ${JSON.stringify({
              done: true,
              model: result.model,
              requestedModels: result.requestedModels,
              routingMode: result.routingMode,
            })}\n\n`,
          ),
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
        await recordAiRequest({
          uid: user?.uid || 'anonymous',
          email: user?.email || null,
          mode: parsed.data.mode,
          language: parsed.data.language,
          model: requestedModelForLog(parsed.data),
          status: 'error',
          durationMs: Date.now() - startedAt,
        }).catch(console.error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: publicErrorMessage(error, 'OpenRouter generation failed.') })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
};
