import { appEnv } from '../config/env';
import { consumeSseStream } from '../utils/sse';

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
  await consumeSseStream(response.body, onChunk);
}
