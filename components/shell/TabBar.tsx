"use client";

import { motion } from "framer-motion";
import { Bell, BriefcaseBusiness, History, House, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type Tab = { href: string; label: string; icon: typeof House; badge?: number; match?: (p: string) => boolean };

function TabLink({ tab, active }: { tab: Tab; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      className={cn("relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold", active ? "text-brand" : "text-muted")}
      aria-current={active ? "page" : undefined}
    >
      <span className="relative">
        <Icon size={22} strokeWidth={active ? 2.4 : 2} aria-hidden />
        {tab.badge ? (
          <span className="absolute -right-2 -top-1 min-w-[16px] rounded-full bg-red-ink px-1 text-center text-[10px] font-bold leading-4 text-white">
            {tab.badge > 9 ? "9+" : tab.badge}
          </span>
        ) : null}
      </span>
      {tab.label}
    </Link>
  );
}

function Bar({ children }: { children: React.ReactNode }) {
  return (
    <nav
      aria-label="เมนูหลัก"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto flex max-w-[560px] items-end px-2">{children}</div>
    </nav>
  );
}

export function ReporterTabBar({ unread }: { unread: number }) {
  const path = usePathname();
  // The request form has its own bottom action bar.
  if (path === "/request/new") return null;
  const tabs: Tab[] = [
    { href: "/home", label: "หน้าแรก", icon: House },
    { href: "/history", label: "ประวัติ", icon: History, match: (p) => p.startsWith("/history") || (p.startsWith("/request/") && p !== "/request/new") },
  ];
  const right: Tab[] = [
    { href: "/notifications", label: "แจ้งเตือน", icon: Bell, badge: unread },
    { href: "/profile", label: "โปรไฟล์", icon: UserRound },
  ];
  const isActive = (t: Tab) => (t.match ? t.match(path) : path === t.href || path.startsWith(t.href + "/"));
  return (
    <Bar>
      {tabs.map((t) => (
        <TabLink key={t.href} tab={t} active={isActive(t)} />
      ))}
      <div className="flex flex-1 justify-center">
        <motion.div whileTap={{ scale: 0.94 }} transition={{ duration: 0.1 }} className="-mt-5 mb-1.5">
          <Link
            href="/request/new"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_6px_16px_rgba(91,44,131,0.35)]"
            aria-label="แจ้งซ่อม"
          >
            <Plus size={28} strokeWidth={2.4} aria-hidden />
          </Link>
        </motion.div>
      </div>
      {right.map((t) => (
        <TabLink key={t.href} tab={t} active={isActive(t)} />
      ))}
    </Bar>
  );
}

export function TechTabBar({ unread }: { unread: number }) {
  const path = usePathname();
  const tabs: Tab[] = [
    { href: "/tech", label: "งานของฉัน", icon: BriefcaseBusiness, match: (p) => p === "/tech" || p.startsWith("/tech/job") },
    { href: "/tech/notifications", label: "แจ้งเตือน", icon: Bell, badge: unread },
    { href: "/tech/profile", label: "โปรไฟล์", icon: UserRound },
  ];
  return (
    <Bar>
      {tabs.map((t) => (
        <TabLink key={t.href} tab={t} active={t.match ? t.match(path) : path === t.href} />
      ))}
    </Bar>
  );
}
