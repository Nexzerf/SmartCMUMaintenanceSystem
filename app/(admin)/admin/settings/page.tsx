import type { Metadata } from "next";
import { SettingsView } from "@/components/admin/SettingsView";
import { requirePageUser } from "@/lib/auth/guard";
import { sql } from "@/lib/db";
import { getCatalog } from "@/lib/requests/queries";

export const metadata: Metadata = { title: "ข้อมูลพื้นฐาน" };

export default async function SettingsPage() {
  await requirePageUser("admin");
  const [catalog, technicians] = await Promise.all([
    getCatalog(true),
    sql<{ id: string; username: string; full_name: string; phone: string | null; is_active: boolean; skills: number[] }[]>`
      select u.id, u.username, u.full_name, u.phone, u.is_active,
        coalesce(array_agg(ts.category_id order by ts.category_id) filter (where ts.category_id is not null), '{}') as skills
      from users u left join technician_skills ts on ts.technician_id = u.id
      where u.role = 'technician' group by u.id order by u.is_active desc, u.full_name`,
  ]);
  return (
    <main className="px-4 py-6 md:px-8">
      <h1 className="text-[26px] font-bold tracking-tight">ข้อมูลพื้นฐาน</h1>
      <p className="text-[15px] text-muted">แก้ไขประเภทปัญหา สถานที่ และบัญชีช่างได้ทันที โดยไม่ต้องแก้โค้ด</p>
      <SettingsView catalog={catalog} technicians={technicians} />
    </main>
  );
}
