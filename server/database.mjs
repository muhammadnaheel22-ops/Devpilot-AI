import { neon } from '@neondatabase/serverless';

let queryClient;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw Object.assign(new Error('DATABASE_URL is not configured.'), { status: 503 });
  }
  queryClient ||= neon(process.env.DATABASE_URL);
  return queryClient;
}

export async function createAuthUser({ email, passwordHash, displayName, isAdmin = false }) {
  const sql = getSql();
  try {
    const rows = await sql`
      WITH new_user AS (
        INSERT INTO app_users (email, password_hash, display_name, is_admin)
        VALUES (${email}, ${passwordHash}, ${displayName}, ${isAdmin})
        RETURNING *
      ), new_profile AS (
        INSERT INTO user_profiles (uid, email, display_name, last_seen_at)
        SELECT id::text, email, display_name, now() FROM new_user
      )
      SELECT id::text AS uid, email, display_name AS "displayName",
        photo_url AS "photoURL", is_admin AS "isAdmin", disabled,
        created_at AS "createdAt", last_sign_in_at AS "lastSignInAt"
      FROM new_user
    `;
    return rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw Object.assign(new Error('An account with this email already exists.'), { status: 409 });
    }
    throw error;
  }
}

export async function findAuthUserByEmail(email) {
  const sql = getSql();
  const rows = await sql`
    SELECT id::text AS uid, email, password_hash AS "passwordHash",
      display_name AS "displayName", photo_url AS "photoURL",
      is_admin AS "isAdmin", disabled, created_at AS "createdAt",
      last_sign_in_at AS "lastSignInAt"
    FROM app_users WHERE lower(email) = lower(${email}) LIMIT 1
  `;
  return rows[0] || null;
}

export async function markAuthUserLogin(uid, promoteToAdmin = false) {
  const sql = getSql();
  const rows = await sql`
    UPDATE app_users SET
      last_sign_in_at = now(),
      is_admin = is_admin OR ${promoteToAdmin},
      updated_at = now()
    WHERE id = ${uid}::uuid
    RETURNING id::text AS uid, email, display_name AS "displayName",
      photo_url AS "photoURL", is_admin AS "isAdmin", disabled,
      created_at AS "createdAt", last_sign_in_at AS "lastSignInAt"
  `;
  return rows[0] || null;
}

export async function createAuthSession({ uid, tokenHash, expiresAt }) {
  const sql = getSql();
  await sql`DELETE FROM auth_sessions WHERE expires_at <= now()`;
  await sql`
    INSERT INTO auth_sessions (user_id, token_hash, expires_at)
    VALUES (${uid}::uuid, ${tokenHash}, ${expiresAt})
  `;
}

export async function findAuthUserBySession(tokenHash) {
  const sql = getSql();
  const rows = await sql`
    SELECT u.id::text AS uid, u.email, u.display_name AS "displayName",
      u.photo_url AS "photoURL", u.is_admin AS "isAdmin", u.disabled,
      u.created_at AS "createdAt", u.last_sign_in_at AS "lastSignInAt"
    FROM auth_sessions s
    JOIN app_users u ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash} AND s.expires_at > now()
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function deleteAuthSession(tokenHash) {
  const sql = getSql();
  await sql`DELETE FROM auth_sessions WHERE token_hash = ${tokenHash}`;
}

export async function updateAuthUserProfile(uid, { displayName, photoURL }) {
  const sql = getSql();
  const rows = await sql`
    WITH updated_user AS (
      UPDATE app_users SET
        display_name = COALESCE(${displayName || null}, display_name),
        photo_url = COALESCE(${photoURL || null}, photo_url),
        updated_at = now()
      WHERE id = ${uid}::uuid
      RETURNING *
    ), updated_profile AS (
      UPDATE user_profiles SET
        display_name = (SELECT display_name FROM updated_user),
        photo_url = (SELECT photo_url FROM updated_user),
        updated_at = now()
      WHERE uid = ${uid}
    )
    SELECT id::text AS uid, email, display_name AS "displayName",
      photo_url AS "photoURL", is_admin AS "isAdmin", disabled,
      created_at AS "createdAt", last_sign_in_at AS "lastSignInAt"
    FROM updated_user
  `;
  return rows[0] || null;
}

export async function setAuthUserAdmin(email, isAdmin = true) {
  const sql = getSql();
  const rows = await sql`
    UPDATE app_users SET is_admin = ${isAdmin}, updated_at = now()
    WHERE lower(email) = lower(${email})
    RETURNING id::text AS uid, email, is_admin AS "isAdmin"
  `;
  return rows[0] || null;
}

export async function listAuthUsers() {
  const sql = getSql();
  return sql`
    SELECT id::text AS uid, email, display_name AS name, is_admin AS admin,
      disabled, created_at AS "createdAt", last_sign_in_at AS "lastSignInAt"
    FROM app_users ORDER BY created_at DESC LIMIT 1000
  `;
}

export async function upsertUserProfile(user) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO user_profiles (uid, email, display_name, photo_url, last_seen_at)
    VALUES (${user.uid}, ${user.email || null}, ${user.displayName || user.name || null}, ${user.photoURL || user.picture || null}, now())
    ON CONFLICT (uid) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
      photo_url = COALESCE(EXCLUDED.photo_url, user_profiles.photo_url),
      last_seen_at = now(),
      updated_at = now()
    RETURNING uid, email, display_name AS "displayName", photo_url AS "photoURL",
      created_at AS "createdAt", last_seen_at AS "lastSeenAt"
  `;
  return rows[0];
}

export async function listUserData(resource, uid) {
  const sql = getSql();
  if (resource === 'snippets') {
    return sql`
      SELECT id, title, language, content, tags, created_at AS "createdAt"
      FROM snippets WHERE user_id = ${uid} ORDER BY created_at DESC LIMIT 100
    `;
  }
  if (resource === 'activity') {
    return sql`
      SELECT id, title, mode, language, details, created_at AS at
      FROM activity WHERE user_id = ${uid} ORDER BY created_at DESC LIMIT 200
    `;
  }
  if (resource === 'conversations') {
    return sql`
      SELECT id, title, language, messages, updated_at AS "updatedAt"
      FROM conversations WHERE user_id = ${uid} ORDER BY updated_at DESC LIMIT 100
    `;
  }
  throw Object.assign(new Error('Unknown data resource.'), { status: 404 });
}

export async function createUserData(resource, uid, payload) {
  const sql = getSql();
  if (resource === 'snippets') {
    const rows = await sql`
      INSERT INTO snippets (user_id, title, language, content, tags)
      VALUES (${uid}, ${payload.title}, ${payload.language}, ${payload.content}, ${JSON.stringify(payload.tags || [])}::jsonb)
      RETURNING id, title, language, content, tags, created_at AS "createdAt"
    `;
    return rows[0];
  }
  if (resource === 'activity') {
    const rows = await sql`
      INSERT INTO activity (user_id, title, mode, language, details)
      VALUES (${uid}, ${payload.title}, ${payload.mode}, ${payload.language}, ${payload.details || null})
      RETURNING id, title, mode, language, details, created_at AS at
    `;
    return rows[0];
  }
  if (resource === 'conversations') {
    const rows = await sql`
      INSERT INTO conversations (user_id, title, language, messages)
      VALUES (${uid}, ${payload.title}, ${payload.language}, ${JSON.stringify(payload.messages)}::jsonb)
      RETURNING id, title, language, messages, updated_at AS "updatedAt"
    `;
    return rows[0];
  }
  throw Object.assign(new Error('Unknown data resource.'), { status: 404 });
}

export async function deleteUserData(resource, uid, id) {
  const sql = getSql();
  if (resource !== 'snippets') {
    throw Object.assign(new Error('Deletion is not supported for this resource.'), { status: 405 });
  }
  await sql`DELETE FROM snippets WHERE id = ${id} AND user_id = ${uid}`;
}

export async function insertAiRequest(entry) {
  if (!isDatabaseConfigured()) return;
  const sql = getSql();
  await sql`
    INSERT INTO ai_requests
      (user_id, email, mode, language, model, status, output_characters, duration_ms)
    VALUES
      (${entry.uid || null}, ${entry.email || null}, ${entry.mode}, ${entry.language},
       ${entry.model}, ${entry.status}, ${entry.outputCharacters || 0}, ${entry.durationMs || 0})
  `;
}

export async function listRecentAiRequests() {
  const sql = getSql();
  return sql`
    SELECT id, COALESCE(user_id, 'anonymous') AS uid, COALESCE(email, 'Anonymous') AS email,
      mode, model, status, duration_ms AS "durationMs",
      output_characters AS "outputCharacters", created_at AS "createdAt"
    FROM ai_requests ORDER BY created_at DESC LIMIT 100
  `;
}
