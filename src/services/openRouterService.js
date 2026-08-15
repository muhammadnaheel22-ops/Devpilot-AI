import { appEnv } from '../config/env';

export async function streamOpenRouter({
  messages,
  mode,
  language,
  model,
  options = {},
  onChunk,
  signal,
}) {
  const response = await fetch(`${appEnv.apiBaseUrl}/openrouter/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, mode, language, model, options }),
    signal,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || `AI request failed (${response.status})`);
  }
  if (!response.body) throw new Error('Streaming is not supported in this browser.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';
    for (const event of events) {
      const line = event.split('\n').find((item) => item.startsWith('data:'));
      if (!line) continue;
      const data = JSON.parse(line.slice(5).trim());
      if (data.error) throw new Error(data.error);
      if (data.text) onChunk(data.text);
    }
    if (done) break;
  }
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
