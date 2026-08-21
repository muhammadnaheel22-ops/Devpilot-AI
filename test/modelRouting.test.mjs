import test from 'node:test';
import assert from 'node:assert/strict';
import { aiRequestSchema, requestedModelForLog } from '../server/backend.mjs';
import { buildRoutingRequest, normalizeModelRouting } from '../src/utils/modelRouting.js';

const messages = [{ role: 'user', content: 'Build a reliable API.' }];

test('accepts auto, manual free models, and ordered free fallback routing', () => {
  assert.equal(aiRequestSchema.safeParse({ messages, routing: { mode: 'auto' } }).success, true);
  assert.equal(
    aiRequestSchema.safeParse({
      messages,
      routing: { mode: 'manual', primaryModel: 'openai/gpt-oss-20b:free' },
    }).success,
    true,
  );
  assert.equal(
    aiRequestSchema.safeParse({
      messages,
      routing: {
        mode: 'fallback',
        primaryModel: 'openai/gpt-oss-20b:free',
        fallbackModels: ['google/gemma-3-27b-it:free', 'qwen/qwen3-coder:free'],
      },
    }).success,
    true,
  );
});

test('rejects fallback routing without a fallback model', () => {
  const result = aiRequestSchema.safeParse({
    messages,
    routing: { mode: 'fallback', primaryModel: 'openai/gpt-oss-20b:free', fallbackModels: [] },
  });
  assert.equal(result.success, false);
});

test('normalizes stale preferences against the live catalog', () => {
  const models = [
    { id: 'openai/gpt-oss-20b:free' },
    { id: 'google/gemma-3-27b-it:free' },
    { id: 'qwen/qwen3-coder:free' },
  ];
  const normalized = normalizeModelRouting(
    {
      mode: 'fallback',
      primaryModel: 'removed/model',
      fallbackModels: ['google/gemma-3-27b-it:free', 'google/gemma-3-27b-it:free', 'removed/model'],
    },
    models,
    'openai/gpt-oss-20b:free',
  );
  assert.deepEqual(normalized, {
    mode: 'fallback',
    primaryModel: 'openai/gpt-oss-20b:free',
    fallbackModels: ['google/gemma-3-27b-it:free'],
  });
  assert.deepEqual(buildRoutingRequest(normalized), normalized);
});

test('falls back to manual routing until a fallback chain is configured', () => {
  assert.deepEqual(
    buildRoutingRequest({
      mode: 'fallback',
      primaryModel: 'openai/gpt-oss-20b:free',
      fallbackModels: [],
    }),
    { mode: 'manual', primaryModel: 'openai/gpt-oss-20b:free' },
  );
  assert.equal(requestedModelForLog({ routing: { mode: 'auto' } }), 'openrouter/free');
});
