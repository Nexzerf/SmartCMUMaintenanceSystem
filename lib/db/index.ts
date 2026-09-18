import "server-only";
import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __sql: postgres.Sql | undefined;
}

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
  return postgres(url, {
    // Supabase's transaction pooler does not support prepared statements.
    prepare: false,
    // Local PGlite is a single backend: keep one connection so extended-protocol messages never interleave.
    max: Number(process.env.DATABASE_POOL_MAX) || (process.env.NODE_ENV === "production" ? 5 : 10),
    // Serverless: instances freeze between requests, so recycle connections quickly
    // rather than reusing a socket the pooler has already dropped.
    idle_timeout: 10,
    max_lifetime: 60 * 5,
    connect_timeout: 15,
    onnotice: () => {},
    transform: { undefined: null },
  });
}

/** Reuse one pool across hot reloads in development. */
export const sql: postgres.Sql = globalThis.__sql ?? (globalThis.__sql = create());

export type Tx = postgres.TransactionSql;
