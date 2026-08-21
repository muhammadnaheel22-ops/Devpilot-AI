import test from 'node:test';
import assert from 'node:assert/strict';
import { aiRequestSchema, requestedModelForLog } from '../server/backend.mjs';
import { buildRoutingRequest, normalizeModelRouting } from '../src/utils/modelRouting.js';

const messages = [{ role: 'user', content: 'Build a reliable API.' }];

test('accepts auto, manual latest aliases, and ordered fallback routing', () => {
  assert.equal(aiRequestSchema.safeParse({ messages, routing: { mode: 'auto' } }).success, true);
  assert.equal(
    aiRequestSchema.safeParse({
      messages,
      routing: { mode: 'manual', primaryModel: '~anthropic/claude-sonnet-latest' },
    }).success,
    true,
  );
  assert.equal(
    aiRequestSchema.safeParse({
      messages,
      routing: {
        mode: 'fallback',
        primaryModel: 'openai/gpt-5',
        fallbackModels: ['anthropic/claude-sonnet-4', 'google/gemini-2.5-pro'],
      },
    }).success,
    true,
  );
});

test('rejects fallback routing without a fallback model', () => {
  const result = aiRequestSchema.safeParse({
    messages,
    routing: { mode: 'fallback', primaryModel: 'openai/gpt-5', fallbackModels: [] },
  });
  assert.equal(result.success, false);
});

test('normalizes stale preferences against the live catalog', () => {
  const models = [
    { id: 'openai/gpt-5' },
    { id: 'anthropic/claude-sonnet-4' },
    { id: 'google/gemini-2.5-pro' },
  ];
  const normalized = normalizeModelRouting(
    {
      mode: 'fallback',
      primaryModel: 'removed/model',
      fallbackModels: ['anthropic/claude-sonnet-4', 'anthropic/claude-sonnet-4', 'removed/model'],
    },
    models,
    'openai/gpt-5',
  );
  assert.deepEqual(normalized, {
    mode: 'fallback',
    primaryModel: 'openai/gpt-5',
    fallbackModels: ['anthropic/claude-sonnet-4'],
  });
  assert.deepEqual(buildRoutingRequest(normalized), normalized);
});

test('falls back to manual routing until a fallback chain is configured', () => {
  assert.deepEqual(
    buildRoutingRequest({ mode: 'fallback', primaryModel: 'openai/gpt-5', fallbackModels: [] }),
    { mode: 'manual', primaryModel: 'openai/gpt-5' },
  );
  assert.equal(requestedModelForLog({ routing: { mode: 'auto' } }), 'openrouter/auto');
});
