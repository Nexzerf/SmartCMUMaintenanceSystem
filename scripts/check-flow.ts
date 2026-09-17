/**
 * State-machine check against the database (run with the react-server condition so server-only modules load):
 *   npx tsx --conditions=react-server scripts/check-flow.ts
 * Creates a throwaway request, drives it through the demo flow, and asserts each step.
 */
import "./env";
import assert from "node:assert/strict";
import { sql } from "../lib/db";
import { findDuplicate, technicianOptions } from "../lib/requests/queries";
import { runAutoClose, transitionStatus } from "../lib/requests/transition";

const id = async (u: string) => (await sql`select id from users where username = ${u}`)[0].id as string;
const status = async (rid: string) => (await sql`select status from requests where id = ${rid}`)[0].status as string;
const expectFail = async (p: Promise<unknown>, label: string) => {
  await assert.rejects(p);
  console.log(`  ✓ rejected: ${label}`);
};

async function main() {
  const [student, staff, tech01, tech02, admin] = await Promise.all(["student02", "staff01", "tech01", "tech02", "admin01"].map(id));
  const [room] = await sql`select rm.id from rooms rm join buildings b on b.id = rm.building_id where b.name_th = 'อาคารศูนย์ประชุม' limit 1`;
  const [cat] = await sql`select id from categories where name_th = 'เครื่องปรับอากาศ'`;
  const [req] = await sql`insert into requests (code, reporter_id, category_id, room_id, description, urgency)
    values (${"TEST-" + Date.now()}, ${student}, ${cat.id}, ${room.id}, 'ทดสอบระบบ state machine', 'normal') returning id`;
  const rid = req.id as string;
  const A = { id: admin, role: "admin" as const };
  const R = { id: student, role: "reporter" as const };
  try {
    console.log("duplicate + follow");
    const dup = await findDuplicate(room.id, cat.id, staff);
    assert.equal(dup?.id, rid);
    await sql`insert into request_followers (request_id, user_id) values (${rid}, ${staff})`;

    console.log("invalid transitions");
    await expectFail(transitionStatus({ requestId: rid, to: "in_progress", actor: { id: tech01, role: "technician" } }), "technician starts unassigned job");
    await expectFail(transitionStatus({ requestId: rid, to: "cancelled", actor: { id: staff, role: "reporter" } }), "follower cancels someone else's request");
    await expectFail(transitionStatus({ requestId: rid, to: "rejected", actor: A }), "reject without reason");

    console.log("need_info round trip");
    await transitionStatus({ requestId: rid, to: "need_info", actor: A, note: "ขอรูปเพิ่ม" });
    await transitionStatus({ requestId: rid, to: "pending", actor: R, note: "ส่งแล้ว" });
    assert.equal(await status(rid), "pending");

    console.log("accept + assign best match");
    await transitionStatus({ requestId: rid, to: "accepted", actor: A });
    const opts = await technicianOptions(cat.id);
    assert.equal(opts[0].id, tech01, "tech01 should be the best aircon match");
    await transitionStatus({ requestId: rid, to: "assigned", actor: A, assignTechnicianId: tech01 });
    await expectFail(transitionStatus({ requestId: rid, to: "in_progress", actor: { id: tech02, role: "technician" } }), "other technician starts job");

    console.log("technician flow");
    const T = { id: tech01, role: "technician" as const };
    await transitionStatus({ requestId: rid, to: "in_progress", actor: T });
    await transitionStatus({ requestId: rid, to: "waiting_parts", actor: T, note: "รออะไหล่" });
    await transitionStatus({ requestId: rid, to: "in_progress", actor: T });
    await transitionStatus({ requestId: rid, to: "completed", actor: T });
    await expectFail(transitionStatus({ requestId: rid, to: "cancelled", actor: R }), "cancel after pending");

    console.log("reopen -> reassign -> complete -> confirm");
    await transitionStatus({ requestId: rid, to: "reopened", actor: R, note: "ยังมีน้ำหยด" });
    let [row] = await sql`select status, assigned_technician_id, reopen_count from requests where id = ${rid}`;
    assert.deepEqual([row.status, row.assigned_technician_id, row.reopen_count], ["accepted", null, 1]);
    const [techNote] = await sql`select title from notifications where user_id = ${tech01} and request_id = ${rid} and type = 'reopened'`;
    assert.ok(techNote, "technician notified about reopen");
    await transitionStatus({ requestId: rid, to: "assigned", actor: A, assignTechnicianId: tech01 });
    await transitionStatus({ requestId: rid, to: "in_progress", actor: T });
    await transitionStatus({ requestId: rid, to: "completed", actor: T });
    await transitionStatus({ requestId: rid, to: "closed", actor: R });
    assert.equal(await status(rid), "closed");

    const [{ n: followerNotes }] = await sql`select count(*)::int as n from notifications where user_id = ${staff} and request_id = ${rid}`;
    assert.ok(followerNotes >= 8, `follower received notifications (${followerNotes})`);
    const [{ n: hist }] = await sql`select count(*)::int as n from status_history where request_id = ${rid}`;
    console.log(`  ✓ ${hist} history rows, follower got ${followerNotes} notifications`);

    console.log("auto-close");
    const [req2] = await sql`insert into requests (code, reporter_id, category_id, room_id, description, status, assigned_technician_id, completed_at)
      values (${"TEST2-" + Date.now()}, ${student}, ${cat.id}, ${room.id}, 'ทดสอบปิดอัตโนมัติ', 'completed', ${tech01}, now() - interval '4 days') returning id`;
    await runAutoClose(true);
    assert.equal(await status(req2.id), "closed");
    await sql`delete from requests where id = ${req2.id}`;

    console.log("\nAll state machine checks passed.");
  } finally {
    await sql`delete from requests where id = ${rid}`;
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
