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

export async function upsertUserProfile(user) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO user_profiles (uid, email, display_name, photo_url, last_seen_at)
    VALUES (${user.uid}, ${user.email || null}, ${user.name || null}, ${user.picture || null}, now())
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
      SELECT id, title, mode, language, created_at AS at
      FROM activity WHERE user_id = ${uid} ORDER BY created_at DESC LIMIT 50
    `;
  }
  if (resource === 'conversations') {
    return sql`
      SELECT id, title, language, messages, updated_at AS "updatedAt"
      FROM conversations WHERE user_id = ${uid} ORDER BY updated_at DESC LIMIT 20
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
      INSERT INTO activity (user_id, title, mode, language)
      VALUES (${uid}, ${payload.title}, ${payload.mode}, ${payload.language})
      RETURNING id, title, mode, language, created_at AS at
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
