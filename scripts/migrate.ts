import "./env";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });

  if (process.argv.includes("--reset")) {
    console.log("Dropping all tables...");
    await sql.unsafe(`
      drop table if exists notifications, ratings, info_requests, repair_notes, status_history,
        request_followers, request_images, requests, request_code_counters, rooms, buildings,
        campuses, technician_skills, categories, users cascade;
    `);
  }

  const dir = path.join(process.cwd(), "db", "migrations");
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    console.log(`Applying ${file}`);
    await sql.unsafe(fs.readFileSync(path.join(dir, file), "utf8"));
  }
  await sql.end();
  console.log("Migrations done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
