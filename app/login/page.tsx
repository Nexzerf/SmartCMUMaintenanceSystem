import type { Metadata } from "next";
import { Bell, Camera, MapPin } from "lucide-react";
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
      <section className="hidden flex-col justify-between bg-brand px-14 py-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <Logo inverted />
          <div>
            <p className="text-[17px] font-bold leading-tight">แจ้งซ่อม มช.</p>
            <p className="text-sm text-white/80">มหาวิทยาลัยเชียงใหม่</p>
          </div>
        </div>
        <div className="max-w-[440px]">
          <h2 className="text-[36px] font-bold leading-tight tracking-tight">เจออะไรเสียในมหาวิทยาลัย แจ้งได้ในไม่ถึง 3 นาที</h2>
          <ul className="mt-10 space-y-6">
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
        <p className="text-[13px] text-white/70">ต้นแบบสำหรับรายวิชา 954244 System Analysis and Design for Modern Management</p>
      </section>

      <div className="flex flex-col items-center px-5 py-10 sm:justify-center lg:bg-page">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo />
            <div>
              <p className="text-[15px] font-bold leading-tight">แจ้งซ่อม มช.</p>
              <p className="text-[13px] text-muted">มหาวิทยาลัยเชียงใหม่</p>
            </div>
          </div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">มีอะไรเสีย บอกเราได้เลย</h1>
          <p className="mt-2 text-[15px] text-muted">เข้าสู่ระบบด้วย CMU Account เพื่อแจ้งซ่อมและติดตามงาน</p>
          <LoginForm expired={expired === "1"} />
        </div>
      </div>
    </main>
  );
}

function Logo({ inverted }: { inverted?: boolean }) {
  return (
    <span className={`inline-flex h-11 w-11 items-center justify-center rounded-[12px] ${inverted ? "bg-white text-brand" : "bg-brand text-white"}`} aria-hidden>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.6 17.4a1.4 1.4 0 0 0 2 2l5.7-5.7a4 4 0 0 0 5.4-5.4l-2.5 2.5-2-2 2.5-2.5z" />
      </svg>
    </span>
  );
}
