"use client";

import { ClipboardList, Database, LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin", label: "แดชบอร์ด", icon: LayoutDashboard, exact: true },
  { href: "/admin/requests", label: "คำร้องทั้งหมด", icon: ClipboardList },
  { href: "/admin/settings", label: "ข้อมูลพื้นฐาน", icon: Database },
];

export function AdminSidebar({ pending, name }: { pending: number; name: string }) {
  const path = usePathname();
  const [leaving, start] = useTransition();

  return (
    <aside className="sticky top-0 z-30 bg-white md:h-dvh md:w-[76px] md:shrink-0 lg:w-[240px]">
      <div className="flex h-full items-center gap-1 px-3 py-2 md:flex-col md:items-stretch md:px-3 md:py-5">
        <div className="mr-2 flex items-center gap-2.5 md:mb-6 md:mr-0 md:justify-center md:px-1 lg:justify-start lg:px-2">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand text-white" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.6 17.4a1.4 1.4 0 0 0 2 2l5.7-5.7a4 4 0 0 0 5.4-5.4l-2.5 2.5-2-2 2.5-2.5z" />
            </svg>
          </span>
          <div className="hidden min-w-0 lg:block">
            <p className="text-[15px] font-bold leading-tight">แจ้งซ่อม มช.</p>
            <p className="truncate text-xs text-muted">{name}</p>
          </div>
        </div>

        <nav aria-label="เมนูผู้ดูแลระบบ" className="flex flex-1 gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {NAV.map((item) => {
            const active = item.exact ? path === item.href : path.startsWith(item.href);
            const Icon = item.icon;
            const badge = item.href === "/admin/requests" && pending > 0 ? pending : null;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={cn(
                  "relative flex min-h-11 shrink-0 items-center gap-3 rounded-[12px] px-3 text-[15px] font-semibold transition-colors md:justify-center lg:justify-start",
                  active ? "bg-brand-soft text-brand" : "text-ink hover:bg-fill",
                )}
              >
                <Icon size={20} aria-hidden />
                <span className="md:sr-only lg:not-sr-only">{item.label}</span>
                {badge ? (
                  <span
                    className="ml-auto inline-flex min-w-[22px] items-center justify-center rounded-full bg-red-ink px-1.5 text-xs font-bold leading-[22px] text-white md:absolute md:right-1 md:top-0.5 md:ml-0 md:min-w-[18px] md:leading-[18px] lg:static lg:ml-auto lg:min-w-[22px] lg:leading-[22px]"
                    aria-label={`รอรับเรื่อง ${badge} รายการ`}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => start(() => logout())}
          disabled={leaving}
          title="ออกจากระบบ"
          className="flex min-h-11 shrink-0 items-center gap-3 rounded-[12px] px-3 text-[15px] font-semibold text-red-ink hover:bg-red-tint md:justify-center lg:justify-start"
        >
          <LogOut size={20} aria-hidden />
          <span className="sr-only lg:not-sr-only">ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
