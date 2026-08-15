import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. Copy the pooled connection string from Neon into .env.');
  process.exitCode = 1;
} else {
  const sql = neon(process.env.DATABASE_URL);
  const source = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
  const statements = source
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) await sql.query(statement);
  console.log(`Neon migration complete: ${statements.length} statements applied.`);
}
