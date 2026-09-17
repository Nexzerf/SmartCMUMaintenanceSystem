import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="mt-1 text-[24px] font-bold">ไม่พบหน้านี้</h1>
      <p className="mt-2 max-w-[320px] text-[15px] text-muted">คำร้องอาจไม่มีอยู่ หรือคุณไม่มีสิทธิ์ดูคำร้องนี้</p>
      <Link href="/" className="mt-6 inline-flex min-h-12 items-center rounded-[12px] bg-brand px-5 font-semibold text-white">
        กลับหน้าแรก
      </Link>
    </main>
  );
}
