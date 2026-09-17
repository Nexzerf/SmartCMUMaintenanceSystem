import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ActiveRequestCard } from "@/components/reporter/ActiveRequestCard";
import { EmptyIllustration } from "@/components/reporter/EmptyIllustration";
import { RequestRows } from "@/components/request/RequestRow";
import { NotificationBell } from "@/components/shell/NotificationBell";
import { ButtonLink } from "@/components/ui/Button";
import { requirePageUser } from "@/lib/auth/guard";
import { firstName } from "@/lib/format";
import { listReporterRequests, unreadCount } from "@/lib/requests/queries";
import { runAutoClose } from "@/lib/requests/transition";
import { serialize } from "@/lib/serialize";
import { OPEN_STATUSES } from "@/lib/status";

export const metadata: Metadata = { title: "หน้าแรก" };

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Bangkok" }).format(new Date()));
  if (h < 11) return "อรุณสวัสดิ์";
  if (h < 17) return "สวัสดีตอนบ่าย";
  return "สวัสดีตอนเย็น";
}

export default async function HomePage() {
  const user = await requirePageUser("reporter");
  await runAutoClose();
  const [requests, unread] = await Promise.all([listReporterRequests(user.id), unreadCount(user.id)]);
  const active = requests.find((r) => OPEN_STATUSES.includes(r.status) && !r.merged_into_code);
  const recent = requests.slice(0, 3);

  return (
    <main>
      <header className="flex items-center gap-3 px-5 pt-6">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] text-muted">{greeting()}</p>
          <h1 className="truncate text-[28px] font-bold leading-tight tracking-tight">คุณ{firstName(user.full_name)}</h1>
        </div>
        <NotificationBell unread={unread} requestBase="/request" />
      </header>

      <div className="space-y-6 px-5 pt-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
        <div className="space-y-6">
        {active ? (
          <section aria-labelledby="active-title">
            <h2 id="active-title" className="mb-2 text-[13px] font-medium text-muted">
              งานที่กำลังดำเนินการ
            </h2>
            <ActiveRequestCard request={serialize(active)} />
          </section>
        ) : null}

        <section className="rounded-[20px] bg-white p-5">
          <p className="text-[17px] font-bold">มีอะไรเสีย บอกเราได้เลย</p>
          <p className="mt-1 text-sm text-muted">ถ่ายรูป เลือกสถานที่ ส่งเรื่องได้ในไม่ถึง 3 นาที</p>
          <ButtonLink href="/request/new" size="lg" block className="mt-4">
            <Plus size={22} strokeWidth={2.5} aria-hidden />
            แจ้งซ่อม
          </ButtonLink>
        </section>

        </div>

        <section aria-labelledby="recent-title">
          <div className="mb-2 flex items-center justify-between">
            <h2 id="recent-title" className="text-[17px] font-bold">
              คำร้องล่าสุด
            </h2>
            {requests.length > 0 ? (
              <Link href="/history" className="inline-flex min-h-11 items-center px-1 text-[15px] font-semibold text-brand">
                ดูทั้งหมด
              </Link>
            ) : null}
          </div>
          {recent.length ? (
            <RequestRows items={serialize(recent)} hrefBase="/request" />
          ) : (
            <div className="flex flex-col items-center rounded-[16px] bg-white px-6 pb-8 pt-6 text-center">
              <EmptyIllustration />
              <p className="mt-2 text-[17px] font-bold">ยังไม่มีอะไรเสีย วันนี้ มช. สบายดี</p>
              <p className="mt-1 text-sm text-muted">เจออะไรชำรุดในมหาวิทยาลัย กดแจ้งซ่อมได้ทันที</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
