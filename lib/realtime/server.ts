import "server-only";

/**
 * Sends lightweight "something changed" pings over Supabase Realtime Broadcast.
 * Payloads carry no personal data: clients re-fetch through authorized server code.
 * Without Supabase configured, clients fall back to polling /api/pulse.
 */
export async function broadcast(topics: string[], event = "changed", payload: Record<string, unknown> = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const unique = [...new Set(topics)];
  if (!url || !key || unique.length === 0) return;
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({ messages: unique.map((topic) => ({ topic, event, payload })) }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.warn("[realtime] broadcast failed", err);
  }
}

export const userTopic = (userId: string) => `user-${userId}`;
export const ADMIN_TOPIC = "admins";
