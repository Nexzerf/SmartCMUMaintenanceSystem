import { PageHeader } from "@/components/ui/PageHeader";
import { listNotifications } from "@/lib/requests/queries";
import { serialize } from "@/lib/serialize";
import { NotificationList } from "./NotificationList";

export async function NotificationsScreen({ userId, requestBase }: { userId: string; requestBase: string }) {
  const items = serialize(await listNotifications(userId, 60));
  return (
    <main className="lg:mx-auto lg:max-w-[820px]">
      <PageHeader title="แจ้งเตือน" large className="pt-6" />
      <div className="px-5 pt-4">
        <NotificationList items={items} requestBase={requestBase} />
      </div>
    </main>
  );
}
