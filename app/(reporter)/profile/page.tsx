import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { ProfileForm } from "@/components/reporter/ProfileForm";
import { LogoutButton } from "@/components/shell/LogoutButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { requirePageUser } from "@/lib/auth/guard";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "โปรไฟล์" };

export default async function ProfilePage() {
  const user = await requirePageUser("reporter");
  return (
    <main className="lg:mx-auto lg:max-w-[820px]">
      <PageHeader title="โปรไฟล์" subtitle={`${user.username}@cmu.ac.th`} large className="pt-6" />
      <div className="space-y-6 px-5 pt-5">
        <ProfileForm mode="edit" initial={{ full_name: user.full_name, user_type: user.user_type, faculty: user.faculty, phone: user.phone }} />
        {user.pdpa_accepted_at ? (
          <p className="flex items-center gap-2 text-[13px] text-muted">
            <ShieldCheck size={16} className="text-green-ink" aria-hidden />
            ยอมรับเงื่อนไข PDPA เมื่อ {formatDate(user.pdpa_accepted_at)}
          </p>
        ) : null}
        <LogoutButton />
      </div>
    </main>
  );
}
