import test from 'node:test';
import assert from 'node:assert/strict';
import { createGeminiContents } from '../server/geminiMessages.mjs';

test('drops assistant welcome messages and starts Gemini history with the user', () => {
  assert.deepEqual(
    createGeminiContents([
      { role: 'assistant', content: 'Welcome' },
      { role: 'user', content: '  Build it  ' },
      { role: 'assistant', content: 'Done' },
    ]),
    [
      { role: 'user', parts: [{ text: 'Build it' }] },
      { role: 'model', parts: [{ text: 'Done' }] },
    ],
  );
});

test('merges consecutive roles to satisfy Gemini role alternation', () => {
  assert.deepEqual(
    createGeminiContents([
      { role: 'user', content: 'First' },
      { role: 'user', content: 'Second' },
      { role: 'assistant', content: 'Answer' },
    ]),
    [
      { role: 'user', parts: [{ text: 'First\n\nSecond' }] },
      { role: 'model', parts: [{ text: 'Answer' }] },
    ],
  );
});

test('rejects histories without a user turn', () => {
  assert.deepEqual(createGeminiContents([{ role: 'assistant', content: 'Welcome' }]), []);
});
