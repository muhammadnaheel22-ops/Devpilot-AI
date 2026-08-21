import { appEnv } from '../config/env';
import { consumeSseStream } from '../utils/sse';

export async function streamOpenRouter({
  messages,
  mode,
  language,
  model,
  routing,
  options = {},
  onChunk,
  onComplete,
  signal,
}) {
  const response = await fetch(`${appEnv.apiBaseUrl}/openrouter/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, mode, language, model, routing, options }),
    signal,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || `AI request failed (${response.status})`);
  }
  if (!response.body) throw new Error('Streaming is not supported in this browser.');

  let completion = null;
  await consumeSseStream(response.body, onChunk, (event) => {
    if (event.done) {
      completion = event;
      onComplete?.(event);
    }
  });
  return completion;
}

export async function getOpenRouterModels({ signal } = {}) {
  const response = await fetch(`${appEnv.apiBaseUrl}/openrouter/models`, {
    credentials: 'include',
    signal,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `Unable to load AI models (${response.status})`);
  }
  return payload;
}
