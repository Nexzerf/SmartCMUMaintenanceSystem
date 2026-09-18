"use client";

import { Bell, BriefcaseBusiness, History, House, LogOut, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/cn";
import { BrandIcon } from "@/components/ui/Brand";

type Item = { href: string; label: string; icon: typeof House; badge?: number; match: (p: string) => boolean };

/** Desktop (≥ 1024 px) navigation for reporters and technicians. Phones use the bottom tab bar instead. */
export function AppSidebar({ role, name, subtitle, unread }: { role: "reporter" | "technician"; name: string; subtitle: string; unread: number }) {
  const path = usePathname();
  const [leaving, start] = useTransition();

  const items: Item[] =
    role === "reporter"
      ? [
          { href: "/home", label: "หน้าแรก", icon: House, match: (p) => p === "/home" },
          { href: "/history", label: "ประวัติการแจ้งซ่อม", icon: History, match: (p) => p.startsWith("/history") || (p.startsWith("/request/") && p !== "/request/new") },
          { href: "/notifications", label: "แจ้งเตือน", icon: Bell, badge: unread, match: (p) => p.startsWith("/notifications") },
          { href: "/profile", label: "โปรไฟล์", icon: UserRound, match: (p) => p === "/profile" },
        ]
      : [
          { href: "/tech", label: "งานของฉัน", icon: BriefcaseBusiness, match: (p) => p === "/tech" || p.startsWith("/tech/job") },
          { href: "/tech/notifications", label: "แจ้งเตือน", icon: Bell, badge: unread, match: (p) => p.startsWith("/tech/notifications") },
          { href: "/tech/profile", label: "โปรไฟล์", icon: UserRound, match: (p) => p.startsWith("/tech/profile") },
        ];

  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col bg-white px-3 py-5 lg:flex">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <BrandIcon size={40} />
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-tight">FastFix CMU</p>
          <p className="truncate text-xs text-muted">{subtitle}</p>
        </div>
      </div>

      {role === "reporter" ? (
        <Link
          href="/request/new"
          className="mb-4 flex min-h-12 items-center justify-center gap-2 rounded-[12px] bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          <Plus size={20} strokeWidth={2.5} aria-hidden />
          แจ้งซ่อม
        </Link>
      ) : null}

      <nav aria-label="เมนูหลัก" className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = item.match(path);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-[15px] font-semibold transition-colors",
                active ? "bg-brand-soft text-brand" : "text-ink hover:bg-fill",
              )}
            >
              <Icon size={20} aria-hidden />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-red-ink px-1.5 text-xs font-bold leading-[22px] text-white" aria-label={`ยังไม่อ่าน ${item.badge} รายการ`}>
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-2 pt-3">
        <p className="truncate text-sm font-semibold">{name}</p>
        <button
          type="button"
          onClick={() => start(() => logout())}
          disabled={leaving}
          className="-mx-2 mt-1 flex min-h-11 w-[calc(100%+16px)] items-center gap-3 rounded-[12px] px-2 text-[15px] font-semibold text-red-ink hover:bg-red-tint"
        >
          <LogOut size={20} aria-hidden />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
