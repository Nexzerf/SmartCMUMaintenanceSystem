"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="text-[22px] font-bold">โหลดข้อมูลไม่สำเร็จ</h1>
      <p className="mt-2 max-w-[320px] text-[15px] text-muted">อาจเป็นเพราะอินเทอร์เน็ตขัดข้องชั่วคราว ข้อมูลของคุณยังอยู่ ลองอีกครั้งได้เลย</p>
      <button type="button" onClick={reset} className="mt-6 inline-flex min-h-12 items-center rounded-[12px] bg-brand px-5 font-semibold text-white">
        ลองอีกครั้ง
      </button>
    </main>
  );
}
