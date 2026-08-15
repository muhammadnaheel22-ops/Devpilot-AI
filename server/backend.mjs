import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import { insertAiRequest, isDatabaseConfigured, listRecentAiRequests } from './database.mjs';

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
  options: z.record(z.string(), z.unknown()).optional(),
});

let firebaseServices;

export function getFirebaseServices() {
  if (firebaseServices !== undefined) return firebaseServices;
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    firebaseServices = null;
    return firebaseServices;
  }

  const app =
    getApps()[0] ||
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  firebaseServices = { auth: getAuth(app) };
  return firebaseServices;
}

export async function authenticateRequest(req, { required = false, admin = false } = {}) {
  const services = getFirebaseServices();
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    if (required || admin)
      throw Object.assign(new Error('Authentication required.'), { status: 401 });
    return null;
  }
  if (!services) {
    throw Object.assign(new Error('Server authentication is not configured.'), { status: 503 });
  }

  try {
    const user = await services.auth.verifyIdToken(token);
    if (admin && user.admin !== true) {
      throw Object.assign(new Error('Administrator access required.'), { status: 403 });
    }
    return user;
  } catch (error) {
    if (error.status) throw error;
    throw Object.assign(new Error('Invalid or expired session.'), { status: 401 });
  }
}

export function systemInstruction(mode, language) {
  return `You are DevPilot AI, a senior software engineer and secure coding assistant. Mode: ${mode}. Preferred language: ${language}. Produce accurate, maintainable, production-ready answers. State assumptions. Never invent executed test results. Never expose secrets. Prefer parameterized queries, input validation, accessible UI, explicit error handling, and concise setup instructions. Use Markdown with fenced code blocks and file names.`;
}

export async function streamOpenRouter({ messages, mode, language, signal, onText }) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw Object.assign(new Error('OPENROUTER_API_KEY is not configured on the server.'), {
      status: 503,
    });
  }

  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
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
      model,
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

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const data = line.trim();
      if (!data.startsWith('data:')) continue;
      const json = data.slice(5).trim();
      if (!json || json === '[DONE]') continue;
      const event = JSON.parse(json);
      if (event.error) throw new Error(event.error.message || 'OpenRouter streaming failed.');
      const text = event.choices?.[0]?.delta?.content;
      if (text) {
        outputCharacters += text.length;
        onText(text);
      }
    }
    if (done) break;
  }

  return { model, outputCharacters };
}

export async function recordAiRequest(entry) {
  await insertAiRequest(entry);
}

export async function getAdminOverview() {
  const services = getFirebaseServices();
  if (!services || !isDatabaseConfigured()) {
    throw Object.assign(new Error('Firebase Admin or Neon database is not configured.'), {
      status: 503,
    });
  }

  const [usersResult, requests] = await Promise.all([
    services.auth.listUsers(1000),
    listRecentAiRequests(),
  ]);
  const users = usersResult.users.map((user) => ({
    uid: user.uid,
    email: user.email || 'No email',
    name: user.displayName || 'Unnamed user',
    disabled: user.disabled,
    admin: user.customClaims?.admin === true,
    createdAt: user.metadata.creationTime,
    lastSignInAt: user.metadata.lastSignInTime,
  }));
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
