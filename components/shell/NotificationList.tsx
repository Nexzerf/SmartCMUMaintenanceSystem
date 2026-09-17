"use client";

import { motion } from "framer-motion";
import { Bell, CheckCheck, CircleAlert, CircleCheck, Clock, PackageSearch, UserCheck, Wrench, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/format";

export type NotificationView = {
  id: string;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
  request_code: string | null;
};

const ICONS: Record<string, { icon: typeof Bell; cls: string }> = {
  submitted: { icon: Clock, cls: "bg-gray-tint text-gray-ink" },
  pending: { icon: Clock, cls: "bg-gray-tint text-gray-ink" },
  accepted: { icon: CircleCheck, cls: "bg-blue-tint text-blue-ink" },
  assigned: { icon: UserCheck, cls: "bg-blue-tint text-blue-ink" },
  job_assigned: { icon: Wrench, cls: "bg-brand-soft text-brand" },
  in_progress: { icon: Wrench, cls: "bg-blue-tint text-blue-ink" },
  waiting_parts: { icon: PackageSearch, cls: "bg-orange-tint text-orange-ink" },
  need_info: { icon: CircleAlert, cls: "bg-orange-tint text-orange-ink" },
  reopened: { icon: CircleAlert, cls: "bg-orange-tint text-orange-ink" },
  completed: { icon: CircleCheck, cls: "bg-green-tint text-green-ink" },
  closed: { icon: CheckCheck, cls: "bg-green-tint text-green-ink" },
  rejected: { icon: XCircle, cls: "bg-red-tint text-red-ink" },
  cancelled: { icon: XCircle, cls: "bg-red-tint text-red-ink" },
};

export function NotificationList({
  items,
  requestBase,
  onNavigate,
  onChanged,
}: {
  items: NotificationView[];
  requestBase: string;
  onNavigate?: () => void;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const unread = items.filter((n) => !n.read_at).length;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-14 text-center">
        <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-fill text-muted">
          <Bell size={22} aria-hidden />
        </span>
        <p className="font-semibold">ยังไม่มีการแจ้งเตือน</p>
        <p className="mt-1 text-sm text-muted">เมื่อคำร้องมีความคืบหน้า เราจะแจ้งที่นี่</p>
      </div>
    );
  }

  return (
    <div>
      {unread > 0 ? (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await markAllNotificationsRead();
                onChanged?.();
                router.refresh();
              })
            }
            className="min-h-11 px-2 text-sm font-semibold text-brand"
          >
            อ่านทั้งหมดแล้ว
          </button>
        </div>
      ) : null}
      <ul className="overflow-hidden rounded-[16px] bg-white">
        {items.map((n, i) => {
          const meta = ICONS[n.type] ?? { icon: Bell, cls: "bg-fill text-muted" };
          const Icon = meta.icon;
          return (
            <motion.li
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 6) * 0.04, duration: 0.25 }}
              className="relative after:absolute after:bottom-0 after:left-[68px] after:right-0 after:h-px after:bg-line last:after:hidden"
            >
              <button
                type="button"
                onClick={() =>
                  start(async () => {
                    if (!n.read_at) await markNotificationRead(n.id);
                    onChanged?.();
                    onNavigate?.();
                    if (n.request_code) router.push(`${requestBase}/${n.request_code}`);
                    else router.refresh();
                  })
                }
                className={cn("flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#fafafb]", !n.read_at && "bg-[#fbf9fd]")}
              >
                <span className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full", meta.cls)} aria-hidden>
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={cn("text-[15px] leading-snug", n.read_at ? "font-medium" : "font-bold")}>{n.title}</span>
                    <span className="shrink-0 text-xs text-muted" suppressHydrationWarning>{relativeTime(n.created_at)}</span>
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-muted">{n.body}</span>
                </span>
                {!n.read_at ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="ยังไม่อ่าน" /> : null}
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
