import { z } from 'zod';
import {
  insertAiRequest,
  isDatabaseConfigured,
  listAuthUsers,
  listRecentAiRequests,
} from './database.mjs';
export { authenticateRequest } from './auth.mjs';

const openRouterModelIdSchema = z
  .string()
  .trim()
  .min(3)
  .max(180)
  .regex(/^~?[a-zA-Z0-9._:-]+\/[a-zA-Z0-9._:+-]+$/, 'Invalid OpenRouter model ID.');

const routingSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('auto') }),
  z.object({ mode: z.literal('manual'), primaryModel: openRouterModelIdSchema }),
  z.object({
    mode: z.literal('fallback'),
    primaryModel: openRouterModelIdSchema,
    fallbackModels: z.array(openRouterModelIdSchema).min(1).max(5),
  }),
]);

export const aiRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(30_000),
      }),
    )
    .min(1)
    .max(30),
  mode: z.string().trim().max(40).default('chat'),
  language: z.string().trim().max(40).default('auto'),
  model: openRouterModelIdSchema.optional(),
  routing: routingSchema.optional(),
  options: z.record(z.string(), z.unknown()).optional(),
});

const modelCache = { expiresAt: 0, models: [] };

export function getDefaultOpenRouterModel() {
  return process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
}

export async function listOpenRouterModels() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw Object.assign(new Error('OPENROUTER_API_KEY is not configured on the server.'), {
      status: 503,
    });
  }
  if (modelCache.expiresAt > Date.now() && modelCache.models.length) return modelCache.models;

  const response = await fetch('https://openrouter.ai/api/v1/models/user', {
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
  });
  if (!response.ok) {
    throw Object.assign(new Error(`Unable to load OpenRouter models (${response.status}).`), {
      status: response.status,
    });
  }

  const payload = await response.json();
  const models = (payload.data || [])
    .filter((model) => {
      const outputModalities = model.architecture?.output_modalities || [];
      return (
        model?.id &&
        (outputModalities.includes('text') || model.architecture?.modality?.endsWith('->text'))
      );
    })
    .map((model) => {
      const outputModalities = model.architecture?.output_modalities || [];
      return {
        id: model.id,
        name: model.name || model.id,
        provider: model.id.split('/')[0],
        contextLength: model.context_length || null,
        promptPrice: model.pricing?.prompt || null,
        completionPrice: model.pricing?.completion || null,
        description: model.description || '',
        created: model.created || null,
        inputModalities: model.architecture?.input_modalities || [],
        outputModalities,
        supportedParameters: model.supported_parameters || [],
      };
    })
    .sort((a, b) => a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name));

  if (!models.length) {
    throw Object.assign(new Error('OpenRouter returned no text-generation models.'), {
      status: 503,
    });
  }
  modelCache.models = models;
  modelCache.expiresAt = Date.now() + 10 * 60_000;
  return models;
}

async function validateAvailableModels(requestedModels) {
  const models = await listOpenRouterModels();
  const available = new Set(models.map((model) => model.id));
  const unavailable = requestedModels.find(
    (model) => model !== 'openrouter/auto' && !available.has(model),
  );
  if (unavailable) {
    throw Object.assign(new Error('The selected OpenRouter model is not available.'), {
      status: 400,
    });
  }
}

export async function resolveOpenRouterRouting({ routing, model: legacyModel }) {
  if (!routing) {
    const model = legacyModel || getDefaultOpenRouterModel();
    await validateAvailableModels([model]);
    return { mode: 'manual', requestedModels: [model], requestBody: { model } };
  }

  if (routing.mode === 'auto') {
    return {
      mode: 'auto',
      requestedModels: ['openrouter/auto'],
      requestBody: { model: 'openrouter/auto' },
    };
  }

  const requestedModels = [
    routing.primaryModel,
    ...(routing.mode === 'fallback' ? routing.fallbackModels : []),
  ].filter((model, index, all) => all.indexOf(model) === index);
  if (routing.mode === 'fallback' && requestedModels.length < 2) {
    throw Object.assign(new Error('Choose at least one different fallback model.'), {
      status: 400,
    });
  }
  await validateAvailableModels(requestedModels);
  return {
    mode: routing.mode,
    requestedModels,
    requestBody:
      routing.mode === 'fallback' ? { models: requestedModels } : { model: requestedModels[0] },
  };
}

export function systemInstruction(mode, language) {
  return `You are DevPilot AI, a senior software engineer and secure coding assistant. Mode: ${mode}. Preferred language: ${language}. Produce accurate, maintainable, production-ready answers. State assumptions. Never invent executed test results. Never expose secrets. Prefer parameterized queries, input validation, accessible UI, explicit error handling, and concise setup instructions. Use Markdown with fenced code blocks and file names.`;
}

export async function streamOpenRouter({
  messages,
  mode,
  language,
  model: requestedModel,
  routing,
  signal,
  onText,
}) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw Object.assign(new Error('OPENROUTER_API_KEY is not configured on the server.'), {
      status: 503,
    });
  }

  const resolvedRouting = await resolveOpenRouterRouting({ routing, model: requestedModel });
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      ...(process.env.OPENROUTER_SITE_URL
        ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL }
        : {}),
      ...(process.env.OPENROUTER_APP_NAME ? { 'X-Title': process.env.OPENROUTER_APP_NAME } : {}),
    },
    body: JSON.stringify({
      ...resolvedRouting.requestBody,
      stream: true,
      temperature: 0.35,
      max_tokens: 8192,
      messages: [{ role: 'system', content: systemInstruction(mode, language) }, ...messages],
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload?.error?.message || `OpenRouter request failed (${response.status}).`;
    throw Object.assign(new Error(message), { status: response.status });
  }
  if (!response.body) throw new Error('OpenRouter returned an empty response stream.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let outputCharacters = 0;
  let usedModel = resolvedRouting.requestedModels[0];

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    if (done && buffer.trim()) {
      lines.push(buffer);
      buffer = '';
    }

    for (const line of lines) {
      const data = line.trim();
      if (!data.startsWith('data:')) continue;
      const json = data.slice(5).trim();
      if (!json || json === '[DONE]') continue;
      const event = JSON.parse(json);
      if (event.error) throw new Error(event.error.message || 'OpenRouter streaming failed.');
      if (typeof event.model === 'string' && event.model) usedModel = event.model;
      const text = event.choices?.[0]?.delta?.content;
      if (text) {
        outputCharacters += text.length;
        onText(text);
      }
    }
    if (done) break;
  }

  return {
    model: usedModel,
    requestedModels: resolvedRouting.requestedModels,
    routingMode: resolvedRouting.mode,
    outputCharacters,
  };
}

export function requestedModelForLog(request) {
  if (request.routing?.mode === 'auto') return 'openrouter/auto';
  return request.routing?.primaryModel || request.model || getDefaultOpenRouterModel();
}

export async function recordAiRequest(entry) {
  await insertAiRequest(entry);
}

export async function getAdminOverview() {
  if (!isDatabaseConfigured()) {
    throw Object.assign(new Error('Neon database is not configured.'), {
      status: 503,
    });
  }

  const [users, requests] = await Promise.all([listAuthUsers(), listRecentAiRequests()]);
  const activeUsers = new Set(
    requests.filter((item) => item.uid !== 'anonymous').map((item) => item.uid),
  );

  return {
    generatedAt: new Date().toISOString(),
    metrics: {
      totalUsers: users.length,
      recentRequests: requests.length,
      activeUsers: activeUsers.size,
      failedRequests: requests.filter((item) => item.status === 'error').length,
    },
    users,
    requests,
  };
}
