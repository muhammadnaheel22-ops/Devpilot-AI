import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyOptionalFirebaseAuth } from '../server/firebaseAuth.mjs';

test('optional server authentication is bypassed only when explicitly disabled', async () => {
  const previous = process.env.REQUIRE_AUTH;
  delete process.env.REQUIRE_AUTH;
  assert.deepEqual(await verifyOptionalFirebaseAuth(), { ok: true, user: null });

  process.env.REQUIRE_AUTH = 'true';
  assert.deepEqual(await verifyOptionalFirebaseAuth(), {
    ok: false,
    status: 503,
    message: 'Server authentication is not configured.',
  });

  if (previous === undefined) delete process.env.REQUIRE_AUTH;
  else process.env.REQUIRE_AUTH = previous;
});
