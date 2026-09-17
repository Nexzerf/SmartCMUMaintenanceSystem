"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

let client: SupabaseClient | null = null;
function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}

const POLL_MS = 4000;

/**
 * Keeps server-rendered screens fresh. Uses Supabase Realtime Broadcast when configured,
 * otherwise polls a tiny version endpoint. Either way the screen re-renders via router.refresh().
 */
export function LiveUpdates({ topics }: { topics: string[] }) {
  const router = useRouter();
  const lastRefresh = useRef(0);
  const topicKey = topics.join(",");

  useEffect(() => {
    const refresh = () => {
      // Coalesce bursts (one transition can ping several topics).
      const now = Date.now();
      if (now - lastRefresh.current < 400) return;
      lastRefresh.current = now;
      router.refresh();
      window.dispatchEvent(new CustomEvent("cmu:live-update"));
    };

    const sb = supabase();
    if (sb) {
      const channels = topicKey.split(",").map((topic) =>
        sb
          .channel(topic)
          .on("broadcast", { event: "changed" }, refresh)
          .subscribe(),
      );
      return () => {
        channels.forEach((c) => sb.removeChannel(c));
      };
    }

    let version: string | null = null;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch("/api/pulse", { cache: "no-store" });
          if (res.status === 401) return; // session ended; IdleLogout / middleware handle redirect
          const data = (await res.json()) as { version: string };
          if (version !== null && data.version !== version) refresh();
          version = data.version;
        } catch {
          // Network hiccup: try again next tick.
        }
      }
      if (!stopped) timer = setTimeout(tick, POLL_MS);
    };
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [topicKey, router]);

  return null;
}
