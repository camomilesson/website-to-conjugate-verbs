// Optional local PostgreSQL/WASM check, no Supabase account or credentials required.
// npm install --prefix /private/tmp/conjugadora-db-check @electric-sql/pglite
// node scripts/check-learning-sql.mjs /private/tmp/conjugadora-db-check/node_modules/@electric-sql/pglite/dist/index.js
import { readFile } from "node:fs/promises"
import { pathToFileURL } from "node:url"
if (!process.argv[2])
  throw new Error(
    "Provide the installed PGlite dist/index.js path; see this script header.",
  )
const { PGlite } = await import(pathToFileURL(process.argv[2]).href)
const db = new PGlite()
try {
  await db.exec(`create role anon; create role authenticated;
    create schema auth; create table auth.users(id uuid primary key,email text);
    create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;`)
  for (const file of [
    "supabase/migrations/202611050001_user_preferences.sql",
    "supabase/migrations/202611060001_durable_practice.sql",
    "supabase/tests/durable_practice.sql",
  ]) {
    await db.exec(await readFile(file, "utf8"))
    console.log(`PASS ${file}`)
  }
} finally {
  await db.close()
}
