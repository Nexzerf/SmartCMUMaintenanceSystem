import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/reporter/ProfileForm";
import { IdleLogout } from "@/components/shell/IdleLogout";
import { requirePageUser } from "@/lib/auth/guard";

export const metadata: Metadata = { title: "ตั้งค่าโปรไฟล์" };

export default async function ProfileSetupPage() {
  const user = await requirePageUser("reporter", { allowIncompleteProfile: true });
  if (user.profile_completed) redirect("/home");

  return (
    <main className="mx-auto min-h-dvh max-w-[560px] px-5 pb-10 pt-8 lg:my-12 lg:min-h-0 lg:max-w-[640px] lg:px-0">
      <p className="text-sm font-semibold text-brand">ขั้นตอนเดียวก่อนเริ่ม</p>
      <h1 className="mt-1 text-[26px] font-bold leading-tight">บอกเราสักนิดว่าคุณคือใคร</h1>
      <p className="mb-7 mt-2 text-[15px] text-muted">ข้อมูลนี้ช่วยให้ช่างติดต่อกลับได้ถูกคน กรอกครั้งเดียว แก้ไขภายหลังได้</p>
      <ProfileForm mode="setup" initial={{ full_name: user.full_name, user_type: user.user_type, faculty: user.faculty, phone: user.phone }} />
      <IdleLogout />
    </main>
  );
}
