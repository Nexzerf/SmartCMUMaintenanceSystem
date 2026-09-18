import "server-only";

/**
 * Slows down password guessing: after 5 wrong passwords for one username from one IP, or 30 from one IP
 * (a whole classroom can share one campus IP), within WINDOW_MS further attempts are refused until
 * the window passes.
 * Kept in memory, so it is per server instance: a best-effort limit that needs no database table.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = { user: 5, ip: 30 };
const MAX_KEYS = 5000;

const failures = new Map<string, number[]>();

function recent(key: string, now: number) {
  const list = (failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length) failures.set(key, list);
  else failures.delete(key);
  return list;
}

/** Minutes until the next attempt is allowed, or 0 when not locked. */
export function lockedMinutes(keys: string[], now = Date.now()) {
  let wait = 0;
  for (const key of keys) {
    const list = recent(key, now);
    const max = key.startsWith("ip:") ? MAX_FAILURES.ip : MAX_FAILURES.user;
    if (list.length >= max) wait = Math.max(wait, list[0] + WINDOW_MS - now);
  }
  return Math.ceil(wait / 60_000);
}

export function recordFailure(keys: string[], now = Date.now()) {
  if (failures.size > MAX_KEYS) failures.clear(); // bound memory under a flood of random usernames
  for (const key of keys) failures.set(key, [...recent(key, now), now]);
}

export function clearFailures(keys: string[]) {
  for (const key of keys) failures.delete(key);
}
