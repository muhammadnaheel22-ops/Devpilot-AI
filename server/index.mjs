import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import {
  aiRequestSchema,
  authenticateRequest,
  getAdminOverview,
  recordAiRequest,
  streamOpenRouter,
} from './backend.mjs';
import { runDataOperation } from './data-api.mjs';
import { isDatabaseConfigured } from './database.mjs';

const app = express();
const port = Number(process.env.PORT || 8787);
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((value) => value.trim());

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(Object.assign(new Error('Origin not allowed.'), { status: 403 }));
    },
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(
  '/api',
  rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }),
);

app.get('/api/health', (_req, res) =>
  res.json({
    ok: true,
    service: 'devpilot-ai-api',
    provider: 'openrouter',
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    database: isDatabaseConfigured() ? 'neon' : 'not-configured',
  }),
);

async function dataRoute(req, res, next) {
  try {
    const user = await authenticateRequest(req, { required: true });
    const result = await runDataOperation({
      method: req.method,
      resource: req.params.resource,
      id: req.params.id,
      body: req.body,
      user,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}
app.all('/api/data/:resource', dataRoute);
app.all('/api/data/:resource/:id', dataRoute);

app.post('/api/openrouter/stream', async (req, res, next) => {
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
    res.flushHeaders?.();

    const upstreamController = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) upstreamController.abort();
    });

    const result = await streamOpenRouter({
      ...parsed.data,
      signal: upstreamController.signal,
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
    if (!res.headersSent) return next(error);
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
});

app.get('/api/admin/overview', async (req, res, next) => {
  try {
    await authenticateRequest(req, { admin: true });
    res.json(await getAdminOverview());
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ message: error.message || 'Unexpected server error.' });
});

app.listen(port, () => console.log(`DevPilot API listening on http://localhost:${port}`));
