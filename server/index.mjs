import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const app = express();
const port = Number(process.env.PORT || 8787);
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((x) => x.trim());
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed'));
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

const Message = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(30_000),
});
const RequestSchema = z.object({
  messages: z.array(Message).min(1).max(30),
  mode: z.string().max(40).default('chat'),
  language: z.string().max(40).default('auto'),
  options: z.record(z.string(), z.unknown()).optional(),
});

let adminAuth = null;
if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  const adminApp =
    getApps()[0] ||
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  adminAuth = getAuth(adminApp);
}
async function verifyAuth(req, res, next) {
  if (process.env.REQUIRE_AUTH !== 'true') return next();
  if (!adminAuth)
    return res.status(503).json({ message: 'Server authentication is not configured.' });
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Authentication required.' });
  try {
    req.user = await adminAuth.verifyIdToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }
}
function systemInstruction(mode, language) {
  return `You are DevPilot AI, a senior software engineer and secure coding assistant. Mode: ${mode}. Preferred language: ${language}. Produce accurate, maintainable, production-ready answers. State assumptions. Never invent executed test results. Never expose secrets. Prefer parameterized queries, input validation, accessible UI, explicit error handling, and concise setup instructions. Use Markdown with fenced code blocks and file names.`;
}
app.get('/api/health', (_req, res) =>
  res.json({
    ok: true,
    service: 'devpilot-ai-api',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  }),
);
app.post('/api/gemini/stream', verifyAuth, async (req, res) => {
  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ message: 'Invalid request.', issues: parsed.error.issues });
  if (!process.env.GEMINI_API_KEY)
    return res.status(503).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const { messages, mode, language } = parsed.data;
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const stream = await ai.models.generateContentStream({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: systemInstruction(mode, language),
        temperature: 0.35,
        maxOutputTokens: 8192,
      },
    });
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error(error);
    res.write(
      `data: ${JSON.stringify({ error: 'Gemini generation failed. Check model access, quota, and server logs.' })}\n\n`,
    );
    res.end();
  }
});
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Unexpected server error.' });
});
app.listen(port, () => console.log(`DevPilot API listening on http://localhost:${port}`));
