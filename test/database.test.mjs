import test from 'node:test';
import assert from 'node:assert/strict';
import { getSql, normalizeDatabaseUrl } from '../server/database.mjs';

const validUrl =
  'postgresql://app_owner:npg_test_password@ep-round-queen-123-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';

test('accepts a complete Neon PostgreSQL URL', () => {
  assert.equal(normalizeDatabaseUrl(validUrl), validUrl);
});

test('repairs a Neon connection string with a missing scheme', () => {
  assert.equal(normalizeDatabaseUrl(validUrl.replace('postgresql://', '')), validUrl);
});

test('accepts a copied DATABASE_URL assignment with surrounding quotes', () => {
  assert.equal(normalizeDatabaseUrl(`DATABASE_URL="${validUrl}"`), validUrl);
});

test('rejects malformed configuration without exposing credentials', () => {
  const secret = 'npg_super_secret';
  assert.throws(
    () => normalizeDatabaseUrl(`app_owner:${secret}@missing-database-path`),
    (error) =>
      error.code === 'DATABASE_URL_INVALID' &&
      error.status === 503 &&
      !error.message.includes(secret),
  );
});

test('getSql returns a safe configuration error for an invalid environment value', () => {
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'not-a-database-url-with-secret';
  assert.throws(
    () => getSql(),
    (error) => error.code === 'DATABASE_URL_INVALID' && !error.message.includes('secret'),
  );
  if (previous === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = previous;
});
