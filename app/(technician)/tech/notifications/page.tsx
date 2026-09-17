import type { Metadata } from "next";
import { NotificationsScreen } from "@/components/shell/NotificationsScreen";
import { requirePageUser } from "@/lib/auth/guard";

export const metadata: Metadata = { title: "แจ้งเตือน" };

export default async function TechNotificationsPage() {
  const user = await requirePageUser("technician");
  return <NotificationsScreen userId={user.id} requestBase="/tech/job" />;
}
