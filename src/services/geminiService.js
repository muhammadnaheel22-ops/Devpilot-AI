import { appEnv } from '../config/env';

export async function streamGemini({
  messages,
  mode,
  language,
  options = {},
  token,
  onChunk,
  signal,
}) {
  const response = await fetch(`${appEnv.apiBaseUrl}/gemini/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, mode, language, options }),
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
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';
    for (const event of events) {
      const line = event.split('\n').find((item) => item.startsWith('data:'));
      if (!line) continue;
      const data = JSON.parse(line.slice(5).trim());
      if (data.error) throw new Error(data.error);
      if (data.text) onChunk(data.text);
    }
  }
}
