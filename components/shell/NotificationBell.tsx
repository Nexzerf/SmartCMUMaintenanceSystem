"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchNotifications } from "@/app/actions/notifications";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { Sheet } from "@/components/ui/Sheet";
import { NotificationList, type NotificationView } from "./NotificationList";

export function NotificationBell({ unread, requestBase }: { unread: number; requestBase: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationView[] | null>(null);
  const controls = useAnimationControls();
  const prev = useRef(unread);

  // Small shake when a new notification arrives.
  useEffect(() => {
    if (unread > prev.current) {
      controls.start({ rotate: [0, -14, 12, -8, 5, 0], transition: { duration: 0.3 } });
    }
    prev.current = unread;
  }, [unread, controls]);

  const load = useCallback(() => {
    fetchNotifications().then(setItems).catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load, unread]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink transition-colors hover:bg-fill"
        aria-label={unread ? `การแจ้งเตือน ยังไม่อ่าน ${unread} รายการ` : "การแจ้งเตือน"}
      >
        <motion.span animate={controls} style={{ originY: 0.2 }} className="inline-flex">
          <Bell size={20} aria-hidden />
        </motion.span>
        <AnimatePresence>
          {unread > 0 ? (
            <motion.span
              key={unread}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 18 }}
              className="absolute right-1 top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-ink px-1 text-[11px] font-bold leading-[18px] text-white"
              aria-hidden
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="การแจ้งเตือน">
        {items === null ? (
          <ListSkeleton rows={5} />
        ) : (
          <NotificationList items={items} requestBase={requestBase} onNavigate={() => setOpen(false)} onChanged={load} />
        )}
      </Sheet>
    </>
  );
}
