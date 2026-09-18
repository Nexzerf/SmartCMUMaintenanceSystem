import "server-only";
import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __sql: postgres.Sql | undefined;
}

const POOL_MAX = Number(process.env.DATABASE_POOL_MAX) || (process.env.NODE_ENV === "production" ? 8 : 10);

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
  return postgres(url, {
    // Supabase's transaction pooler does not support prepared statements.
    prepare: false,
    // Local PGlite is a single backend: keep one connection so extended-protocol messages never interleave.
    max: POOL_MAX,
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

/** Keep spare connections: a query queued because the pool is full can wait behind the pooler. */
const QUERY_CONCURRENCY = 3;

/**
 * Runs independent queries with a concurrency cap instead of Promise.all.
 * Use this wherever a page needs several queries at once.
 */
export async function runQueries<T extends readonly unknown[]>(tasks: readonly [...{ [K in keyof T]: () => Promise<T[K]> }]): Promise<T> {
  const results = new Array(tasks.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(QUERY_CONCURRENCY, tasks.length) }, async () => {
    for (let i = next++; i < tasks.length; i = next++) {
      results[i] = await tasks[i]();
    }
  });
  await Promise.all(workers);
  return results as unknown as T;
}
