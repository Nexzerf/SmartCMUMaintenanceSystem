import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { IdleLogout } from "@/components/shell/IdleLogout";
import { LiveUpdates } from "@/components/shell/LiveUpdates";
import { requirePageUser } from "@/lib/auth/guard";
import { timed } from "@/lib/perf";
import { pendingCount } from "@/lib/requests/queries";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await timed("layout.requireUser", () => requirePageUser("admin"));
  const pending = await timed("layout.pendingCount", () => pendingCount());
  return (
    <div className="min-h-dvh md:flex">
      <AdminSidebar pending={pending} name={user.full_name} />
      <div className="min-w-0 flex-1">{children}</div>
      <LiveUpdates topics={["admins", `user-${user.id}`]} />
      <IdleLogout />
    </div>
  );
}
