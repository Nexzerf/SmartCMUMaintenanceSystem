import "./env";
import { sql } from "../lib/db";
import { getDashboard, resolveRange } from "../lib/dashboard";
import { listAdminRequests, getCatalog, pendingCount } from "../lib/requests/queries";

const t = async (label: string, fn: () => Promise<unknown>) => {
  const s = Date.now();
  const r = await fn();
  const n = Array.isArray(r) ? ` (${r.length} rows)` : "";
  console.log(`${label}: ${Date.now() - s} ms${n}`);
};

async function main() {
  await sql`select 1`;
  await t("getDashboard 30d (current)", () => getDashboard(resolveRange({ range: "30" })));
  await t("listAdminRequests (no filter)", () => listAdminRequests({}));
  await t("getCatalog(true)", () => getCatalog(true));
  await t("pendingCount", () => pendingCount());
  await sql.end();
}
main();
