import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RequestDetailBody, RequestHeader } from "@/components/request/RequestDetailBody";
import { Timeline } from "@/components/request/Timeline";
import { JobActions } from "@/components/tech/JobActions";
import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageUser } from "@/lib/auth/guard";
import { getRequestForUser } from "@/lib/requests/queries";
import { serialize } from "@/lib/serialize";
import { buildTimeline } from "@/lib/timeline";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  return { title: (await params).code };
}

export default async function TechJobPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await requirePageUser("technician");
  const detail = await getRequestForUser(decodeURIComponent(code), user);
  // Not assigned to this technician (or reassigned/reopened away): back to the job list.
  if (!detail) redirect("/tech");

  const r = serialize(detail);
  const hasActions = ["assigned", "in_progress", "waiting_parts"].includes(r.status);

  return (
    <main className={hasActions ? "pb-24 lg:pb-0" : undefined}>
      <PageHeader title="รายละเอียดงาน" backHref="/tech" backLabel="งานของฉัน" />
      <div className="space-y-5 px-5 pt-4 xl:grid xl:grid-cols-[minmax(0,1fr)_400px] xl:grid-rows-[auto_1fr] xl:items-start xl:gap-6 xl:space-y-0">
        <div className="xl:col-start-1 xl:row-start-1">
          <RequestHeader r={r} />
        </div>
        <aside className="space-y-5 xl:sticky xl:top-6 xl:col-start-2 xl:row-span-2 xl:row-start-1">
          <JobActions requestId={r.id} code={r.code} status={r.status} />
          <section>
            <h2 className="mb-1.5 px-1 text-[13px] font-medium text-muted">ความคืบหน้า</h2>
            <div className="rounded-[16px] bg-white p-4">
              <Timeline model={buildTimeline(r.status, r.status_before_info, r.history, r.technician_name)} />
            </div>
          </section>
        </aside>
        <div className="xl:col-start-1 xl:row-start-2">
          <RequestDetailBody r={r} showReporter />
        </div>
      </div>
    </main>
  );
}
