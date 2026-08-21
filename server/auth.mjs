import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { z } from 'zod';
import {
  createAuthSession,
  createAuthUser,
  deleteAuthSession,
  findAuthUserByEmail,
  findAuthUserBySession,
  markAuthUserLogin,
  updateAuthUserProfile,
} from './database.mjs';

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = 'devpilot_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
const SCRYPT_COST = 16384;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200),
});

export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2).max(100),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(100).optional(),
  photoURL: z.string().trim().url().max(2048).nullable().optional(),
});

function publicUser(user) {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function configuredAdmin(email) {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64, {
    N: SCRYPT_COST,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$${SCRYPT_COST}$8$1$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, cost, blockSize, parallelization, saltValue, hashValue] =
    String(storedHash).split('$');
  if (algorithm !== 'scrypt' || !saltValue || !hashValue) return false;
  const expected = Buffer.from(hashValue, 'base64url');
  const actual = await scrypt(password, Buffer.from(saltValue, 'base64url'), expected.length, {
    N: Number(cost),
    r: Number(blockSize),
    p: Number(parallelization),
    maxmem: 64 * 1024 * 1024,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function readCookieHeader(request) {
  return request?.headers?.get?.('cookie') || request?.headers?.cookie || '';
}

function readSessionToken(request) {
  const cookies = readCookieHeader(request).split(';');
  for (const cookie of cookies) {
    const [name, ...value] = cookie.trim().split('=');
    if (name === SESSION_COOKIE) return decodeURIComponent(value.join('='));
  }
  return null;
}

export function sessionCookie(token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

async function newSession(uid) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await createAuthSession({ uid, tokenHash: hashSessionToken(token), expiresAt });
  return token;
}

export async function registerAccount(input) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    throw Object.assign(
      new Error('Enter a valid name, email, and password of at least 8 characters.'),
      {
        status: 400,
      },
    );
  }
  const passwordHash = await hashPassword(parsed.data.password);
  const user = await createAuthUser({
    email: parsed.data.email,
    displayName: parsed.data.name,
    passwordHash,
    isAdmin: configuredAdmin(parsed.data.email),
  });
  return { user: publicUser(user), token: await newSession(user.uid) };
}

export async function loginAccount(input) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    throw Object.assign(new Error('Invalid email or password.'), { status: 401 });
  }
  const user = await findAuthUserByEmail(parsed.data.email);
  const valid = user && (await verifyPassword(parsed.data.password, user.passwordHash));
  if (!valid || user.disabled) {
    throw Object.assign(new Error('Invalid email or password.'), { status: 401 });
  }
  const updated = await markAuthUserLogin(user.uid, configuredAdmin(user.email));
  return { user: publicUser(updated), token: await newSession(user.uid) };
}

export async function getSessionUser(request) {
  const token = readSessionToken(request);
  if (!token) return null;
  return publicUser(await findAuthUserBySession(hashSessionToken(token)));
}

export async function logoutAccount(request) {
  const token = readSessionToken(request);
  if (token) await deleteAuthSession(hashSessionToken(token));
}

export async function updateAccountProfile(request, input) {
  const user = await authenticateRequest(request, { required: true });
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) throw Object.assign(new Error('Invalid profile data.'), { status: 400 });
  return publicUser(await updateAuthUserProfile(user.uid, parsed.data));
}

export async function authenticateRequest(request, { required = false, admin = false } = {}) {
  const user = await getSessionUser(request);
  if (!user) {
    if (required || admin)
      throw Object.assign(new Error('Authentication required.'), { status: 401 });
    return null;
  }
  if (user.disabled) throw Object.assign(new Error('This account is disabled.'), { status: 403 });
  if (admin && !user.isAdmin) {
    throw Object.assign(new Error('Administrator access required.'), { status: 403 });
  }
  return user;
}
