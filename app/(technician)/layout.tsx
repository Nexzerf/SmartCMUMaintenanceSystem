import { AppSidebar } from "@/components/shell/AppSidebar";
import { IdleLogout } from "@/components/shell/IdleLogout";
import { LiveUpdates } from "@/components/shell/LiveUpdates";
import { TechTabBar } from "@/components/shell/TabBar";
import { requirePageUser } from "@/lib/auth/guard";

export default async function TechnicianLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser("technician");
  const unread = user.unread;
  return (
    <div className="min-h-dvh lg:flex">
      <AppSidebar role="technician" name={`ช่าง${user.full_name}`} subtitle="ช่างซ่อมบำรุง" unread={unread} />
      <div className="mx-auto w-full min-w-0 max-w-[560px] pb-28 lg:w-auto lg:flex-1 lg:max-w-[1120px] lg:px-6 lg:pb-12 lg:pt-4">{children}</div>
      <TechTabBar unread={unread} />
      <LiveUpdates topics={[`user-${user.id}`]} />
      <IdleLogout />
    </div>
  );
}
