// Dev helper: print a session cookie value for a username (for curl testing). Not used by the app.
import "./env";
import postgres from "postgres";
import { signSession } from "../lib/auth/session";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
  const [u] = await sql`select id, role, username from users where username = ${process.argv[2]}`;
  console.log(await signSession({ uid: u.id, role: u.role, username: u.username }));
  await sql.end();
}
main();
