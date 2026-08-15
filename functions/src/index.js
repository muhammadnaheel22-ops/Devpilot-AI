import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';
import { z } from 'zod';

initializeApp();
const openRouterKey = defineSecret('OPENROUTER_API_KEY');
const schema = z.object({
  messages: z
    .array(
      z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(30_000) }),
    )
    .min(1)
    .max(30),
  mode: z.string().max(40).default('chat'),
  language: z.string().max(40).default('auto'),
  model: z
    .string()
    .min(3)
    .max(160)
    .regex(/^[a-zA-Z0-9._:-]+\/[a-zA-Z0-9._:-]+$/)
    .optional(),
});

const modelCache = { expiresAt: 0, models: [] };

async function listModels(apiKey) {
  if (modelCache.expiresAt > Date.now() && modelCache.models.length) return modelCache.models;
  const response = await fetch('https://openrouter.ai/api/v1/models/user', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) throw new Error(`Unable to load OpenRouter models (${response.status}).`);
  const payload = await response.json();
  const models = (payload.data || [])
    .filter((model) => {
      const outputModalities = model.architecture?.output_modalities || [];
      return (
        model?.id &&
        (outputModalities.includes('text') || model.architecture?.modality?.endsWith('->text')) &&
        !outputModalities.includes('image') &&
        !outputModalities.includes('audio')
      );
    })
    .map((model) => ({
      id: model.id,
      name: model.name || model.id,
      provider: model.id.split('/')[0],
      contextLength: model.context_length || null,
      promptPrice: model.pricing?.prompt || null,
      completionPrice: model.pricing?.completion || null,
    }))
    .sort((a, b) => a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name));
  if (!models.length) throw new Error('OpenRouter returned no text-generation models.');
  modelCache.models = models;
  modelCache.expiresAt = Date.now() + 10 * 60_000;
  return models;
}

async function verifyToken(req, required = true) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    if (required) throw Object.assign(new Error('Authentication required.'), { status: 401 });
    return null;
  }
  try {
    return await getAuth().verifyIdToken(token);
  } catch {
    throw Object.assign(new Error('Invalid or expired session.'), { status: 401 });
  }
}

export const api = onRequest(
  { secrets: [openRouterKey], cors: true, timeoutSeconds: 300, memory: '512MiB' },
  async (req, res) => {
    if (req.path.endsWith('/openrouter/models') && req.method === 'GET') {
      try {
        return res.json({
          models: await listModels(openRouterKey.value()),
          defaultModel: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    }

    if (req.path.endsWith('/admin/overview') && req.method === 'GET') {
      try {
        const admin = await verifyToken(req);
        if (admin.admin !== true)
          return res.status(403).json({ message: 'Administrator access required.' });
        const [usersResult, snapshot] = await Promise.all([
          getAuth().listUsers(1000),
          getFirestore().collection('aiRequests').orderBy('createdAt', 'desc').limit(100).get(),
        ]);
        const requests = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.().toISOString() || null,
          };
        });
        const users = usersResult.users.map((user) => ({
          uid: user.uid,
          email: user.email || 'No email',
          name: user.displayName || 'Unnamed user',
          disabled: user.disabled,
          admin: user.customClaims?.admin === true,
          createdAt: user.metadata.creationTime,
          lastSignInAt: user.metadata.lastSignInTime,
        }));
        return res.json({
          generatedAt: new Date().toISOString(),
          metrics: {
            totalUsers: users.length,
            recentRequests: requests.length,
            activeUsers: new Set(requests.map((item) => item.uid).filter(Boolean)).size,
            failedRequests: requests.filter((item) => item.status === 'error').length,
          },
          users,
          requests,
        });
      } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
      }
    }

    if (!req.path.endsWith('/openrouter/stream') || req.method !== 'POST') {
      return res.status(404).json({ message: 'Not found.' });
    }
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid request.' });

    let user;
    try {
      user = await verifyToken(req, process.env.REQUIRE_AUTH !== 'false');
    } catch (error) {
      return res.status(error.status || 401).json({ message: error.message });
    }

    const startedAt = Date.now();
    const defaultModel = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
    const model = parsed.data.model || defaultModel;
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    try {
      if (model !== defaultModel) {
        const models = await listModels(openRouterKey.value());
        if (!models.some((item) => item.id === model)) {
          throw Object.assign(new Error('The selected OpenRouter model is not available.'), {
            status: 400,
          });
        }
      }
      const { messages, mode, language } = parsed.data;
      const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey.value()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          stream: true,
          temperature: 0.35,
          max_tokens: 8192,
          messages: [
            {
              role: 'system',
              content: `You are DevPilot AI, a secure senior software engineer. Mode: ${mode}. Preferred language: ${language}. Return production-ready Markdown.`,
            },
            ...messages,
          ],
        }),
      });
      if (!upstream.ok || !upstream.body)
        throw new Error(`OpenRouter request failed (${upstream.status}).`);
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let outputCharacters = 0;
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const raw = line.trim();
          if (!raw.startsWith('data:')) continue;
          const json = raw.slice(5).trim();
          if (!json || json === '[DONE]') continue;
          const text = JSON.parse(json).choices?.[0]?.delta?.content;
          if (text) {
            outputCharacters += text.length;
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
        if (done) break;
      }
      res.write(`data: ${JSON.stringify({ done: true, model })}\n\n`);
      res.end();
      await getFirestore()
        .collection('aiRequests')
        .add({
          uid: user?.uid || 'anonymous',
          email: user?.email || null,
          mode,
          language,
          model,
          status: 'success',
          outputCharacters,
          durationMs: Date.now() - startedAt,
          createdAt: FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error(error);
      res.write(
        `data: ${JSON.stringify({ error: error.message || 'OpenRouter generation failed.' })}\n\n`,
      );
      res.end();
    }
  },
);
