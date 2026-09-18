/**
 * Bring a database's campuses, buildings and rooms in line with db/locations.ts.
 *
 * - Adds missing campuses, buildings and rooms; fixes floors of existing rooms.
 * - Renames or merges the earlier demo buildings listed in LEGACY_BUILDINGS.
 * - Rooms that are no longer listed are removed after their requests move to the closest listed room
 *   in the same building (same floor and number when possible), so no request loses its location.
 * - Buildings that are neither listed nor legacy (e.g. added by an admin in ข้อมูลพื้นฐาน) are left alone.
 * Runs in one transaction and is safe to re-run.
 *
 *   npm run db:sync-locations            # uses DATABASE_URL
 *   npm run db:sync-locations -- --dry   # report only, roll back
 */
import "./env";
import postgres from "postgres";
import { LEGACY_BUILDINGS, LOCATIONS, roomFloor, roomName } from "../db/locations";

type Room = { id: number; name_th: string; floor: number };

const dry = process.argv.includes("--dry");

/** Closest room: same name, then same floor + same trailing number, then same floor, then nearest lower floor, then any. */
function bestMatch(old: { name_th: string; floor: number }, candidates: Room[]): Room {
  const same = candidates.find((c) => c.name_th === old.name_th);
  if (same) return same;
  const sorted = [...candidates].sort((a, b) => a.floor - b.floor || a.name_th.localeCompare(b.name_th));
  const m = /(\d)(\d\d)\D*$/.exec(old.name_th);
  if (m) {
    const exact = sorted.find((c) => c.floor === Number(m[1]) && new RegExp(m[2] + "$").test(c.name_th));
    if (exact) return exact;
  }
  // A numbered room moving into a dormitory lands on its "ห้องพัก" entry, not a common area.
  if (m) {
    const living = sorted.find((c) => c.name_th.startsWith("ห้องพัก"));
    if (living) return living;
  }
  const sameFloor = sorted.find((c) => c.floor === old.floor);
  if (sameFloor) return sameFloor;
  const lower = sorted.filter((c) => c.floor < old.floor);
  if (lower.length) {
    const top = lower[lower.length - 1].floor;
    return lower.find((c) => c.floor === top)!;
  }
  return sorted[0];
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
  const stats = { campusesAdded: 0, buildingsAdded: 0, buildingsRenamed: 0, buildingsMerged: 0, roomsAdded: 0, roomsUpdated: 0, roomsRemoved: 0, requestsMoved: 0 };
  const moves: string[] = [];

  class DryRun extends Error {}

  try {
    await sql.begin(async (tx) => {
      const campusByName = new Map<string, number>();
      for (const c of LOCATIONS) {
        let [row] = await tx<{ id: number }[]>`select id from campuses where name_th = ${c.name}`;
        if (!row) {
          [row] = await tx<{ id: number }[]>`insert into campuses (name_th) values (${c.name}) returning id`;
          stats.campusesAdded++;
        }
        campusByName.set(c.name, row.id);
      }
      const campusOf = new Map<string, number>();
      for (const c of LOCATIONS) for (const b of c.buildings) campusOf.set(b.name, campusByName.get(c.name)!);

      // Legacy demo buildings: rename in place when the real one does not exist yet, otherwise merge later.
      const merges: { oldId: number; oldName: string; target: string }[] = [];
      for (const [oldName, target] of Object.entries(LEGACY_BUILDINGS)) {
        const [old] = await tx<{ id: number }[]>`select id from buildings where name_th = ${oldName}`;
        if (!old) continue;
        const [existing] = await tx<{ id: number }[]>`select id from buildings where name_th = ${target}`;
        if (!existing) {
          await tx`update buildings set name_th = ${target}, campus_id = ${campusOf.get(target)!} where id = ${old.id}`;
          stats.buildingsRenamed++;
        } else if (existing.id !== old.id) {
          merges.push({ oldId: old.id, oldName, target });
        }
      }

      const moveRequests = async (from: Room, to: Room, where: string) => {
        // Moving to a generic area (no room number) would lose the original room: keep it in the landmark.
        const note = /\d/.test(to.name_th) ? null : `ห้องเดิม: ${from.name_th} ชั้น ${from.floor}`;
        const moved = note
          ? await tx`update requests set room_id = ${to.id},
              landmark = case when landmark is null or landmark = '' then ${note} else landmark || ' · ' || ${note} end
              where room_id = ${from.id} returning id`
          : await tx`update requests set room_id = ${to.id} where room_id = ${from.id} returning id`;
        if (moved.length) {
          stats.requestsMoved += moved.length;
          moves.push(`${where}: ${from.name_th} → ${to.name_th} (${moved.length})`);
        }
      };

      // Listed buildings and rooms.
      const roomsOf = new Map<string, Room[]>();
      for (const c of LOCATIONS) {
        for (const b of c.buildings) {
          let [bRow] = await tx<{ id: number; campus_id: number }[]>`select id, campus_id from buildings where name_th = ${b.name}`;
          if (!bRow) {
            [bRow] = await tx<{ id: number; campus_id: number }[]>`insert into buildings (campus_id, name_th) values (${campusOf.get(b.name)!}, ${b.name}) returning id, campus_id`;
            stats.buildingsAdded++;
          } else if (bRow.campus_id !== campusOf.get(b.name)) {
            await tx`update buildings set campus_id = ${campusOf.get(b.name)!} where id = ${bRow.id}`;
          }
          const existing = await tx<Room[]>`select id, name_th, floor from rooms where building_id = ${bRow.id}`;
          const listed: Room[] = [];
          for (const r of b.rooms) {
            const name = roomName(r);
            const floor = roomFloor(r);
            const found = existing.find((e) => e.name_th === name);
            if (found) {
              if (found.floor !== floor) {
                await tx`update rooms set floor = ${floor} where id = ${found.id}`;
                stats.roomsUpdated++;
              }
              listed.push({ id: found.id, name_th: name, floor });
            } else {
              const [row] = await tx<{ id: number }[]>`insert into rooms (building_id, floor, name_th) values (${bRow.id}, ${floor}, ${name}) returning id`;
              listed.push({ id: row.id, name_th: name, floor });
              stats.roomsAdded++;
            }
          }
          for (const extra of existing.filter((e) => !listed.some((l) => l.id === e.id))) {
            await moveRequests(extra, bestMatch(extra, listed), b.name);
            await tx`delete from rooms where id = ${extra.id}`;
            stats.roomsRemoved++;
          }
          roomsOf.set(b.name, listed);
        }
      }

      // Merge legacy buildings whose real counterpart already existed.
      for (const m of merges) {
        const oldRooms = await tx<Room[]>`select id, name_th, floor from rooms where building_id = ${m.oldId}`;
        for (const r of oldRooms) {
          await moveRequests(r, bestMatch(r, roomsOf.get(m.target)!), `${m.oldName} → ${m.target}`);
          await tx`delete from rooms where id = ${r.id}`;
          stats.roomsRemoved++;
        }
        await tx`delete from buildings where id = ${m.oldId}`;
        stats.buildingsMerged++;
      }

      const [totals] = await tx<{ campuses: number; buildings: number; rooms: number; orphan: number }[]>`
        select (select count(*)::int from campuses) campuses, (select count(*)::int from buildings) buildings,
          (select count(*)::int from rooms) rooms,
          (select count(*)::int from requests q where not exists (select 1 from rooms r where r.id = q.room_id)) orphan`;
      console.log("changes:", stats);
      moves.forEach((m) => console.log("  moved", m));
      console.log("totals after sync:", totals);
      if (dry) throw new DryRun();
    });
    console.log("Committed.");
  } catch (e) {
    if (e instanceof DryRun) console.log("Dry run: rolled back.");
    else throw e;
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
