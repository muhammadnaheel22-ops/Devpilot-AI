import {
  aiRequestSchema,
  authenticateRequest,
  recordAiRequest,
  streamOpenRouter,
} from '../server/backend.mjs';

export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed.' });
  const parsed = aiRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid request.', issues: parsed.error.issues });
  }

  const startedAt = Date.now();
  let user = null;
  try {
    user = await authenticateRequest(req, { required: process.env.REQUIRE_AUTH === 'true' });
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    const result = await streamOpenRouter({
      ...parsed.data,
      onText: (text) => res.write(`data: ${JSON.stringify({ text })}\n\n`),
    });
    res.write(`data: ${JSON.stringify({ done: true, model: result.model })}\n\n`);
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
    if (!res.headersSent) return res.status(error.status || 500).json({ message: error.message });
    res.write(
      `data: ${JSON.stringify({ error: error.message || 'OpenRouter generation failed.' })}\n\n`,
    );
    res.end();
    await recordAiRequest({
      uid: user?.uid || 'anonymous',
      email: user?.email || null,
      mode: parsed.data.mode,
      language: parsed.data.language,
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      status: 'error',
      durationMs: Date.now() - startedAt,
    }).catch(console.error);
  }
}
