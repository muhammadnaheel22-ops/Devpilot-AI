import {
  aiRequestSchema,
  authenticateRequest,
  getDefaultOpenRouterModel,
  listOpenRouterModels,
  recordAiRequest,
  streamOpenRouter,
} from '../server/backend.mjs';
import { publicErrorMessage } from '../server/errors.mjs';

export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      return res.json({
        models: await listOpenRouterModels(),
        defaultModel: getDefaultOpenRouterModel(),
      });
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ message: publicErrorMessage(error, 'Unable to load AI models.') });
    }
  }
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed.' });
  const parsed = aiRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid request.', issues: parsed.error.issues });
  }

  const startedAt = Date.now();
  let user = null;
  try {
    user = await authenticateRequest(req, { required: process.env.REQUIRE_AUTH !== 'false' });
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    const result = await streamOpenRouter({
      ...parsed.data,
      onText: (text) => {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
        res.flush?.();
      },
    });
    res.write(`data: ${JSON.stringify({ done: true, model: result.model })}\n\n`);
    res.flush?.();
    res.end();
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
    if (!res.headersSent)
      return res
        .status(error.status || 500)
        .json({ message: publicErrorMessage(error, 'OpenRouter request failed.') });
    res.write(
      `data: ${JSON.stringify({ error: publicErrorMessage(error, 'OpenRouter generation failed.') })}\n\n`,
    );
    res.flush?.();
    res.end();
    await recordAiRequest({
      uid: user?.uid || 'anonymous',
      email: user?.email || null,
      mode: parsed.data.mode,
      language: parsed.data.language,
      model: parsed.data.model || getDefaultOpenRouterModel(),
      status: 'error',
      durationMs: Date.now() - startedAt,
    }).catch(console.error);
  }
}
