import test from 'node:test';
import assert from 'node:assert/strict';
import { streamOpenRouter } from '../server/backend.mjs';

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.OPENROUTER_API_KEY;

function streamingResponse(model, text = 'Completed') {
  const payload = `data: ${JSON.stringify({
    model,
    choices: [{ delta: { content: text } }],
  })}\n\ndata: [DONE]\n\n`;
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(payload));
        controller.close();
      },
    }),
    { status: 200 },
  );
}

test.after(() => {
  globalThis.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = originalApiKey;
});

test('sends OpenRouter Auto and reports the concrete selected model', async () => {
  process.env.OPENROUTER_API_KEY = 'test-key';
  let requestBody;
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return streamingResponse('anthropic/claude-sonnet-4');
  };
  const chunks = [];
  const result = await streamOpenRouter({
    messages: [{ role: 'user', content: 'Debug this code.' }],
    mode: 'debug',
    language: 'javascript',
    routing: { mode: 'auto' },
    onText: (text) => chunks.push(text),
  });
  assert.equal(requestBody.model, 'openrouter/auto');
  assert.equal(requestBody.models, undefined);
  assert.equal(result.model, 'anthropic/claude-sonnet-4');
  assert.equal(result.routingMode, 'auto');
  assert.deepEqual(chunks, ['Completed']);
});

test('sends an ordered models array for fallback routing', async () => {
  process.env.OPENROUTER_API_KEY = 'test-key';
  const requested = ['openai/gpt-5', 'anthropic/claude-sonnet-4', 'google/gemini-2.5-pro'];
  let requestBody;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/models/user')) {
      return Response.json({
        data: requested.map((id) => ({
          id,
          name: id,
          architecture: { output_modalities: ['text'] },
        })),
      });
    }
    requestBody = JSON.parse(options.body);
    return streamingResponse('anthropic/claude-sonnet-4');
  };
  const result = await streamOpenRouter({
    messages: [{ role: 'user', content: 'Build an API.' }],
    mode: 'chat',
    language: 'typescript',
    routing: {
      mode: 'fallback',
      primaryModel: requested[0],
      fallbackModels: requested.slice(1),
    },
    onText: () => {},
  });
  assert.deepEqual(requestBody.models, requested);
  assert.equal(requestBody.model, undefined);
  assert.equal(result.model, 'anthropic/claude-sonnet-4');
  assert.equal(result.routingMode, 'fallback');
});
