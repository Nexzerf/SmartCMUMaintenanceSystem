import type { Metadata } from "next";
import { DashboardView } from "@/components/admin/DashboardView";
import { requirePageUser } from "@/lib/auth/guard";
import { getDashboard, resolveRange } from "@/lib/dashboard";
import { runAutoClose } from "@/lib/requests/transition";
import { serialize } from "@/lib/serialize";

export const metadata: Metadata = { title: "แดชบอร์ด" };

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  await requirePageUser("admin");
  await runAutoClose();
  const range = resolveRange(await searchParams);
  const data = await getDashboard(range);
  const { rows: _rows, ...view } = data;
  return (
    <main className="px-4 py-6 md:px-8">
      <DashboardView data={serialize(view)} />
    </main>
  );
}
