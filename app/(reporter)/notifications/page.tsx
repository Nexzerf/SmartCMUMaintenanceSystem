import type { Metadata } from "next";
import { NotificationsScreen } from "@/components/shell/NotificationsScreen";
import { requirePageUser } from "@/lib/auth/guard";

export const metadata: Metadata = { title: "แจ้งเตือน" };

export default async function ReporterNotificationsPage() {
  const user = await requirePageUser("reporter");
  return <NotificationsScreen userId={user.id} requestBase="/request" />;
}
