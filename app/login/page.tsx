import type { Metadata } from "next";
import { Bell, Camera, MapPin } from "lucide-react";
import { BrandWordmark } from "@/components/ui/Brand";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

const STEPS = [
  { icon: Camera, title: "ถ่ายรูปจุดที่เสีย", body: "แนบได้สูงสุด 3 รูป ระบบย่อขนาดให้เอง" },
  { icon: MapPin, title: "เลือกอาคารและห้อง", body: "ช่างรู้ตำแหน่งแน่นอนโดยไม่ต้องโทรถาม" },
  { icon: Bell, title: "ติดตามได้ทุกขั้นตอน", body: "แจ้งเตือนทันทีเมื่อรับเรื่อง มอบหมายช่าง และซ่อมเสร็จ" },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Desktop-only brand panel */}
      <section className="hidden flex-col justify-center gap-14 bg-brand px-14 py-12 text-white lg:flex">
        <div>
          <BrandWordmark onBrand height={56} />
          <p className="mt-3 text-sm text-white/80">ระบบแจ้งซ่อมอาคารและอุปกรณ์ มหาวิทยาลัยเชียงใหม่</p>
        </div>
        <div className="max-w-[440px]">
          <h2 className="text-[36px] font-bold leading-tight tracking-tight">เจออะไรเสียในมหาวิทยาลัย แจ้งได้ในไม่ถึง 3 นาที</h2>
          <ul className="mt-9 space-y-6">
            {STEPS.map((s) => (
              <li key={s.title} className="flex gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/15" aria-hidden>
                  <s.icon size={20} />
                </span>
                <div>
                  <p className="text-[16px] font-semibold">{s.title}</p>
                  <p className="text-[14px] text-white/80">{s.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="flex flex-col items-center px-5 py-10 sm:justify-center lg:bg-page">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <BrandWordmark height={44} />
            <p className="mt-2 text-[13px] text-muted">ระบบแจ้งซ่อม มหาวิทยาลัยเชียงใหม่</p>
          </div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">มีอะไรเสีย บอกเราได้เลย</h1>
          <p className="mt-2 text-[15px] text-muted">เข้าสู่ระบบด้วย CMU Account เพื่อแจ้งซ่อมและติดตามงาน</p>
          <LoginForm expired={expired === "1"} />
        </div>
      </div>
    </main>
  );
}
