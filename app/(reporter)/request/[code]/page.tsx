import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequestActions } from "@/components/reporter/RequestActions";
import { RequestDetailBody, RequestHeader } from "@/components/request/RequestDetailBody";
import { Timeline } from "@/components/request/Timeline";
import { NotificationBell } from "@/components/shell/NotificationBell";
import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageUser } from "@/lib/auth/guard";
import { getRequestForUser } from "@/lib/requests/queries";
import { runAutoClose } from "@/lib/requests/transition";
import { serialize } from "@/lib/serialize";
import { buildTimeline } from "@/lib/timeline";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  return { title: (await params).code };
}

export default async function TrackRequestPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await requirePageUser("reporter");
  await runAutoClose();
  const detail = await getRequestForUser(decodeURIComponent(code), user);
  const unread = user.unread;
  if (!detail) notFound();

  const r = serialize(detail);
  const timeline = buildTimeline(r.status, r.status_before_info, r.history, r.technician_name);
  const openQuestion = [...r.info_requests].reverse().find((q) => !q.answer)?.question ?? null;

  return (
    <main>
      <PageHeader title="ติดตามสถานะ" backHref="/history" backLabel="ประวัติ" right={<NotificationBell unread={unread} requestBase="/request" />} />
      {/* Phones and tablets stack everything; from 1280 px actions and the timeline sit in a sticky right column. */}
      <div className="space-y-5 px-5 pt-4 xl:grid xl:grid-cols-[minmax(0,1fr)_400px] xl:grid-rows-[auto_1fr] xl:items-start xl:gap-6 xl:space-y-0">
        <div className="xl:col-start-1 xl:row-start-1">
          <RequestHeader r={r} />
        </div>

        <aside className="space-y-5 xl:sticky xl:top-6 xl:col-start-2 xl:row-span-2 xl:row-start-1">
          <RequestActions
            requestId={r.id}
            code={r.code}
            status={r.status}
            isOwner={r.reporter_id === user.id}
            completedAt={r.completed_at}
            openQuestion={openQuestion}
            categoryId={r.category_id}
            roomId={r.room_id}
            hasRating={!!r.rating}
          />
          <section aria-labelledby="timeline-title">
            <h2 id="timeline-title" className="mb-1.5 px-1 text-[13px] font-medium text-muted">
              ความคืบหน้า
            </h2>
            <div className="rounded-[16px] bg-white p-4">
              <Timeline model={timeline} />
            </div>
          </section>
        </aside>

        <div className="xl:col-start-1 xl:row-start-2">
          <RequestDetailBody r={r} />
        </div>
      </div>
    </main>
  );
}
