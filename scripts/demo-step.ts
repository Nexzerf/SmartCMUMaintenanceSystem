/** Dev helper: drive a request from the command line, e.g. `npx tsx --conditions=react-server scripts/demo-step.ts MR-2609-0013 assign tech01` */
import "./env";
import { sql } from "../lib/db";
import { transitionStatus } from "../lib/requests/transition";

async function main() {
  const [code, step, who] = process.argv.slice(2);
  const [r] = await sql`select id from requests where code = ${code}`;
  const [admin] = await sql`select id from users where username = 'admin01'`;
  if (step === "assign") {
    const [t] = await sql`select id from users where username = ${who}`;
    await transitionStatus({ requestId: r.id, to: "assigned", actor: { id: admin.id, role: "admin" }, assignTechnicianId: t.id });
  } else {
    const [t] = await sql`select assigned_technician_id as id from requests where id = ${r.id}`;
    await transitionStatus({ requestId: r.id, to: step as "in_progress" | "completed", actor: { id: t.id, role: "technician" } });
  }
  console.log(`${code} -> ${step}`);
  await sql.end();
}
main();
