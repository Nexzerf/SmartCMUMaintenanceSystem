/**
 * Local Postgres for development without Docker or Supabase.
 * Runs PGlite (Postgres compiled to WASM) behind the Postgres wire protocol on 127.0.0.1:5433.
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const port = Number(process.env.LOCAL_DB_PORT ?? 5433);

async function main() {
  const db = await PGlite.create({ dataDir: "./.pglite" });
  const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 20 });
  await server.start();
  console.log(`Local Postgres (PGlite) ready: postgres://postgres:postgres@127.0.0.1:${port}/postgres`);
  const stop = async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
