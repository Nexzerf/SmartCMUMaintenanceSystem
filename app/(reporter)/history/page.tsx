import type { Metadata } from "next";
import { HistoryList } from "@/components/reporter/HistoryList";
import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageUser } from "@/lib/auth/guard";
import { listReporterRequests } from "@/lib/requests/queries";
import { runAutoClose } from "@/lib/requests/transition";
import { serialize } from "@/lib/serialize";

export const metadata: Metadata = { title: "ประวัติการแจ้งซ่อม" };

export default async function HistoryPage() {
  const user = await requirePageUser("reporter");
  await runAutoClose();
  const requests = await listReporterRequests(user.id);
  return (
    <main className="lg:max-w-[820px]">
      <PageHeader title="ประวัติ" subtitle="คำร้องที่คุณแจ้งและติดตาม" large className="pt-6" />
      <HistoryList
        items={serialize(requests).map((r) => ({
          code: r.code,
          status: r.status,
          urgency: r.urgency,
          category_id: r.category_id,
          category_name: r.category_name,
          category_icon: r.category_icon,
          campus_name: r.campus_name,
          building_name: r.building_name,
          floor: r.floor,
          room_id: r.room_id,
          room_name: r.room_name,
          created_at: r.created_at,
          updated_at: r.updated_at,
          is_following: r.is_following && r.reporter_id !== user.id,
          merged_into_code: r.merged_into_code,
        }))}
      />
    </main>
  );
}
