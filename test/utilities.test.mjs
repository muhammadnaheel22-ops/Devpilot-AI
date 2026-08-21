import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeBase64,
  decodeJwt,
  encodeBase64,
  generatePassword,
  minifyJavaScript,
} from '../src/utils/devUtils.js';
import { readStoredJson, writeStoredJson } from '../src/utils/storage.js';

test('base64 helpers round-trip Unicode and accept URL-safe JWT payloads', () => {
  const value = 'Hello, 世界 👋';
  assert.equal(decodeBase64(encodeBase64(value)), value);
  const payload = encodeBase64(JSON.stringify({ sub: '123', name: 'Dev Pilot' }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  assert.deepEqual(decodeJwt(`header.${payload}.signature`), { sub: '123', name: 'Dev Pilot' });
  assert.throws(() => decodeJwt('not-a-jwt'), /three-part JWT/);
});

test('password generation clamps unsafe lengths and uses the supported alphabet', () => {
  assert.equal(generatePassword(1).length, 4);
  assert.equal(generatePassword(100_000).length, 128);
  assert.match(generatePassword(32), /^[A-HJ-NP-Za-km-z2-9!@#$%^&*]{32}$/);
});

test('JavaScript whitespace cleanup preserves line-comment and ASI boundaries', () => {
  assert.equal(
    minifyJavaScript(' const first = 1 // keep boundary\n\n const second = 2 '),
    'const first = 1 // keep boundary\nconst second = 2',
  );
});

test('storage helpers recover from malformed or unavailable local storage', () => {
  const values = new Map([['bad', '{broken']]);
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  assert.deepEqual(readStoredJson('bad', [], Array.isArray), []);
  assert.equal(writeStoredJson('good', ['saved']), true);
  assert.deepEqual(readStoredJson('good', [], Array.isArray), ['saved']);
  globalThis.localStorage.getItem = () => {
    throw new Error('blocked');
  };
  assert.deepEqual(readStoredJson('good', [], Array.isArray), []);
});
