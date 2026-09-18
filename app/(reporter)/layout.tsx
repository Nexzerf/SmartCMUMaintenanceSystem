import { AppSidebar } from "@/components/shell/AppSidebar";
import { IdleLogout } from "@/components/shell/IdleLogout";
import { LiveUpdates } from "@/components/shell/LiveUpdates";
import { ReporterTabBar } from "@/components/shell/TabBar";
import { requirePageUser } from "@/lib/auth/guard";

export default async function ReporterLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser("reporter");
  const unread = user.unread;

  return (
    <div className="min-h-dvh lg:flex">
      <AppSidebar role="reporter" name={user.full_name} subtitle={user.user_type === "staff" ? "บุคลากร" : "นักศึกษา"} unread={unread} />
      {/* Phones: one narrow column above a bottom tab bar. Desktop: wide content next to the sidebar. */}
      <div className="mx-auto w-full min-w-0 max-w-[560px] pb-28 lg:w-auto lg:flex-1 lg:max-w-[1120px] lg:px-6 lg:pb-12 lg:pt-4">{children}</div>
      <ReporterTabBar unread={unread} />
      <LiveUpdates topics={[`user-${user.id}`]} />
      <IdleLogout />
    </div>
  );
}
