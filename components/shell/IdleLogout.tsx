"use client";

import { useEffect } from "react";
import { logout } from "@/app/actions/auth";

const IDLE_MS = 30 * 60 * 1000;
const EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;

/** Signs the user out after 30 minutes without interaction (the cookie also expires server-side). */
export function IdleLogout() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let last = Date.now();
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => logout("idle"), IDLE_MS);
    };
    const onActivity = () => {
      // Throttle resets to keep scroll handlers cheap.
      if (Date.now() - last < 5000) return;
      last = Date.now();
      arm();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - last > IDLE_MS) logout("idle");
    };
    arm();
    EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return null;
}
