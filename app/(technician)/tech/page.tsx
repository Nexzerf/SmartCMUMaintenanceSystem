import type { Metadata } from "next";
import { JobList } from "@/components/tech/JobList";
import { NotificationBell } from "@/components/shell/NotificationBell";
import { requirePageUser } from "@/lib/auth/guard";
import { firstName } from "@/lib/format";
import { listTechnicianJobs } from "@/lib/requests/queries";
import { runAutoClose } from "@/lib/requests/transition";
import { serialize } from "@/lib/serialize";

export const metadata: Metadata = { title: "งานของฉัน" };

export default async function TechJobsPage() {
  const user = await requirePageUser("technician");
  await runAutoClose();
  const jobs = await listTechnicianJobs(user.id);
  const unread = user.unread;
  const newCount = jobs.filter((j) => j.status === "assigned").length;

  return (
    <main className="lg:max-w-[900px]">
      <header className="flex items-center gap-3 px-5 pt-6">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] text-muted">ช่าง{firstName(user.full_name)}</p>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">งานของฉัน</h1>
          <p className="mt-0.5 text-sm text-muted">{newCount ? `มีงานใหม่รอรับ ${newCount} งาน` : "ยังไม่มีงานใหม่ รับงานครบแล้ว"}</p>
        </div>
        <NotificationBell unread={unread} requestBase="/tech/job" />
      </header>
      <JobList
        jobs={serialize(jobs).map((j) => ({
          code: j.code,
          status: j.status,
          urgency: j.urgency,
          category_name: j.category_name,
          category_icon: j.category_icon,
          building_name: j.building_name,
          floor: j.floor,
          room_name: j.room_name,
          created_at: j.created_at,
          updated_at: j.updated_at,
        }))}
      />
    </main>
  );
}
