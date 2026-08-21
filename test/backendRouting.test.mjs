import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveOpenRouterRouting, streamOpenRouter } from '../server/backend.mjs';

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.OPENROUTER_API_KEY;
const originalMaxCompletionTokens = process.env.OPENROUTER_MAX_COMPLETION_TOKENS;

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
  if (originalMaxCompletionTokens === undefined)
    delete process.env.OPENROUTER_MAX_COMPLETION_TOKENS;
  else process.env.OPENROUTER_MAX_COMPLETION_TOKENS = originalMaxCompletionTokens;
});

test('sends OpenRouter Auto and reports the concrete selected model', async () => {
  process.env.OPENROUTER_API_KEY = 'test-key';
  process.env.OPENROUTER_MAX_COMPLETION_TOKENS = '1024';
  let requestBody;
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return streamingResponse('openai/gpt-oss-20b:free');
  };
  const chunks = [];
  const result = await streamOpenRouter({
    messages: [{ role: 'user', content: 'Debug this code.' }],
    mode: 'debug',
    language: 'javascript',
    routing: { mode: 'auto' },
    onText: (text) => chunks.push(text),
  });
  assert.equal(requestBody.model, 'openrouter/free');
  assert.equal(requestBody.models, undefined);
  assert.equal(requestBody.max_completion_tokens, 1024);
  assert.equal(requestBody.max_tokens, undefined);
  assert.equal(result.model, 'openai/gpt-oss-20b:free');
  assert.equal(result.routingMode, 'auto');
  assert.deepEqual(chunks, ['Completed']);
});

test('sends an ordered models array for fallback routing', async () => {
  process.env.OPENROUTER_API_KEY = 'test-key';
  process.env.OPENROUTER_MAX_COMPLETION_TOKENS = '1024';
  const requested = [
    'openai/gpt-oss-20b:free',
    'google/gemma-3-27b-it:free',
    'qwen/qwen3-coder:free',
  ];
  let requestBody;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/models/user')) {
      return Response.json({
        data: [
          ...requested.map((id) => ({
            id,
            name: id,
            pricing: { prompt: '0', completion: '0' },
            architecture: { output_modalities: ['text'] },
          })),
          {
            id: 'openai/gpt-5',
            name: 'OpenAI GPT-5',
            pricing: { prompt: '0.000001', completion: '0.00001' },
            architecture: { output_modalities: ['text'] },
          },
        ],
      });
    }
    requestBody = JSON.parse(options.body);
    return streamingResponse('google/gemma-3-27b-it:free');
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
  assert.equal(result.model, 'google/gemma-3-27b-it:free');
  assert.equal(result.routingMode, 'fallback');
});

test('rejects paid models even when a stale client submits one', async () => {
  await assert.rejects(
    resolveOpenRouterRouting({
      routing: { mode: 'manual', primaryModel: 'openai/gpt-5' },
    }),
    /not available as a free OpenRouter model/i,
  );
});

test('retries once within the affordable credit limit', async () => {
  process.env.OPENROUTER_API_KEY = 'test-key';
  process.env.OPENROUTER_MAX_COMPLETION_TOKENS = '1024';
  const requests = [];
  globalThis.fetch = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    if (requests.length === 1) {
      return Response.json(
        {
          error: {
            message:
              'This request requires more credits. You requested up to 1024 tokens, but can only afford 200.',
          },
        },
        { status: 402 },
      );
    }
    return streamingResponse('openai/gpt-oss-20b:free');
  };

  const result = await streamOpenRouter({
    messages: [{ role: 'user', content: 'Give a concise answer.' }],
    mode: 'chat',
    language: 'auto',
    routing: { mode: 'auto' },
    onText: () => {},
  });

  assert.equal(requests.length, 2);
  assert.equal(requests[0].max_completion_tokens, 1024);
  assert.equal(requests[1].max_completion_tokens, 180);
  assert.equal(result.model, 'openai/gpt-oss-20b:free');
});
