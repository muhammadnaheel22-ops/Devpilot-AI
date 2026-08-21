import { z } from 'zod';
import { createUserData, deleteUserData, listUserData, upsertUserProfile } from './database.mjs';

const snippetSchema = z.object({
  title: z.string().trim().min(1).max(200),
  language: z.string().trim().max(40).default('auto'),
  content: z.string().min(1).max(200_000),
  tags: z.array(z.string().max(40)).max(20).default([]),
});
const activitySchema = z.object({
  title: z.string().trim().min(1).max(300),
  mode: z.string().trim().max(40).default('chat'),
  language: z.string().trim().max(40).default('auto'),
  details: z.string().trim().max(50_000).optional(),
});
const conversationSchema = z.object({
  title: z.string().trim().min(1).max(200),
  language: z.string().trim().max(40).default('auto'),
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(50_000) }))
    .max(100),
});

export async function runDataOperation({ method, resource, id, body, user }) {
  const profile = await upsertUserProfile(user);
  if (resource === 'profile' && method === 'POST') return profile;
  if (method === 'GET') return listUserData(resource, user.uid);
  if (method === 'DELETE') {
    if (!id) throw Object.assign(new Error('Record ID is required.'), { status: 400 });
    await deleteUserData(resource, user.uid, id);
    return { ok: true };
  }
  if (method === 'POST') {
    const schema =
      resource === 'snippets'
        ? snippetSchema
        : resource === 'activity'
          ? activitySchema
          : resource === 'conversations'
            ? conversationSchema
            : null;
    if (!schema) throw Object.assign(new Error('Unknown data resource.'), { status: 404 });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw Object.assign(new Error('Invalid data request.'), {
        status: 400,
        issues: parsed.error.issues,
      });
    }
    return createUserData(resource, user.uid, parsed.data);
  }
  throw Object.assign(new Error('Method not allowed.'), { status: 405 });
}
