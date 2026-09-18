import type { Metadata } from "next";
import { Phone, Wrench } from "lucide-react";
import { LogoutButton } from "@/components/shell/LogoutButton";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { GroupedList, GroupedRow } from "@/components/ui/GroupedList";
import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageUser } from "@/lib/auth/guard";
import { sql } from "@/lib/db";
import { formatPhone } from "@/lib/format";

export const metadata: Metadata = { title: "โปรไฟล์" };

export default async function TechProfilePage() {
  const user = await requirePageUser("technician");
  const [skills, [stats]] = await Promise.all([
    sql<{ name_th: string; icon: string }[]>`
      select c.name_th, c.icon from technician_skills ts join categories c on c.id = ts.category_id
      where ts.technician_id = ${user.id} order by c.sort_order`,
    sql<{ open: number; done30: number; avg: number | null }[]>`
      select
        count(*) filter (where status in ('assigned','in_progress','waiting_parts'))::int as open,
        count(*) filter (where completed_at > now() - interval '30 days' or (status = 'closed' and closed_at > now() - interval '30 days'))::int as done30,
        (select round(avg(score)::numeric, 1)::float from ratings rt join requests r2 on r2.id = rt.request_id where r2.assigned_technician_id = ${user.id}) as avg
      from requests where assigned_technician_id = ${user.id}`,
  ]);

  return (
    <main className="lg:mx-auto lg:max-w-[820px]">
      <PageHeader title={`ช่าง${user.full_name}`} subtitle={`${user.username}@cmu.ac.th`} large className="pt-6" />
      <div className="space-y-6 px-5 pt-5">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "งานค้าง", value: stats.open },
            { label: "เสร็จใน 30 วัน", value: stats.done30 },
            { label: "คะแนนเฉลี่ย", value: stats.avg ?? "–" },
          ].map((s) => (
            <div key={s.label} className="rounded-[16px] bg-white p-3 text-center">
              <p className="text-[22px] font-bold tabular-nums">{s.value}</p>
              <p className="text-[12px] text-muted">{s.label}</p>
            </div>
          ))}
        </div>
        <GroupedList title="ความถนัด" footer="ติดต่อเจ้าหน้าที่หากต้องการเปลี่ยนความถนัด">
          {skills.length ? (
            skills.map((s) => <GroupedRow key={s.name_th} icon={<CategoryIcon name={s.icon} size="sm" />} label={s.name_th} />)
          ) : (
            <GroupedRow icon={<Wrench size={18} className="text-muted" />} label="ยังไม่ได้กำหนดความถนัด" />
          )}
        </GroupedList>
        {user.phone ? (
          <GroupedList title="ติดต่อ">
            <GroupedRow icon={<Phone size={18} className="text-muted" />} label={formatPhone(user.phone)} />
          </GroupedList>
        ) : null}
        <LogoutButton />
      </div>
    </main>
  );
}
