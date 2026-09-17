import type { Metadata } from "next";
import { RequestTable } from "@/components/admin/RequestTable";
import { requirePageUser } from "@/lib/auth/guard";
import { getCatalog, listAdminRequests, type AdminFilters } from "@/lib/requests/queries";
import { runAutoClose } from "@/lib/requests/transition";
import { serialize } from "@/lib/serialize";

export const metadata: Metadata = { title: "คำร้องทั้งหมด" };

type Params = Record<string, string | undefined>;

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requirePageUser("admin");
  await runAutoClose();
  const p = await searchParams;
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const filters: AdminFilters = {
    status: p.status || undefined,
    category: Number(p.category) || undefined,
    campus: Number(p.campus) || undefined,
    building: Number(p.building) || undefined,
    urgency: p.urgency || undefined,
    from: p.from && dateRe.test(p.from) ? p.from : undefined,
    to: p.to && dateRe.test(p.to) ? p.to : undefined,
    q: p.q?.slice(0, 40) || undefined,
  };
  const [rows, catalog] = await Promise.all([listAdminRequests(filters), getCatalog(true)]);

  return (
    <main className="px-4 py-6 md:px-8">
      <RequestTable
        rows={serialize(rows)}
        catalog={catalog}
        filters={{ ...filters, category: filters.category?.toString(), campus: filters.campus?.toString(), building: filters.building?.toString() }}
        openCode={p.open}
      />
    </main>
  );
}
