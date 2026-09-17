"use client";

import { ShieldCheck } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { saveProfile, type ProfileState } from "@/app/actions/profile";
import { Button } from "@/components/ui/Button";
import { FieldError, Input, Label } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { cn } from "@/lib/cn";

const FACULTIES = [
  "วิทยาลัยศิลปะ สื่อ และเทคโนโลยี (CAMT)",
  "คณะบริหารธุรกิจ",
  "คณะวิศวกรรมศาสตร์",
  "คณะวิทยาศาสตร์",
  "คณะมนุษยศาสตร์",
  "คณะสังคมศาสตร์",
  "คณะนิติศาสตร์",
  "คณะเศรษฐศาสตร์",
  "คณะแพทยศาสตร์",
  "คณะพยาบาลศาสตร์",
  "คณะสถาปัตยกรรมศาสตร์",
  "สำนักหอสมุด",
  "กองกิจการนักศึกษา",
];

type Initial = { full_name: string; user_type: "student" | "staff" | null; faculty: string | null; phone: string | null };

export function ProfileForm({ mode, initial }: { mode: "setup" | "edit"; initial: Initial }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile.bind(null, mode), {});
  const [userType, setUserType] = useState<"student" | "staff">(initial.user_type ?? "student");
  const [pdpa, setPdpa] = useState(false);
  const e = state.errors ?? {};

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(ev) => {
        // Dispatch manually so React does not reset the form: input survives validation errors.
        ev.preventDefault();
        const data = new FormData(ev.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <div>
        <Label htmlFor="full_name">ชื่อ-นามสกุล</Label>
        <Input id="full_name" name="full_name" defaultValue={initial.full_name} autoComplete="name" placeholder="เช่น สมชาย ใจดี" aria-invalid={!!e.full_name} />
        <FieldError>{e.full_name}</FieldError>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-semibold">สถานะ</span>
        <SegmentedControl
          label="สถานะ"
          value={userType}
          onChange={setUserType}
          options={[
            { value: "student", label: "นักศึกษา" },
            { value: "staff", label: "บุคลากร" },
          ]}
        />
        <input type="hidden" name="user_type" value={userType} />
        <FieldError>{e.user_type}</FieldError>
      </div>

      <div>
        <Label htmlFor="faculty">คณะ/หน่วยงาน</Label>
        <Input id="faculty" name="faculty" list="faculty-list" defaultValue={initial.faculty ?? ""} placeholder="พิมพ์หรือเลือกจากรายการ" aria-invalid={!!e.faculty} />
        <datalist id="faculty-list">
          {FACULTIES.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
        <FieldError>{e.faculty}</FieldError>
      </div>

      <div>
        <Label htmlFor="phone">เบอร์โทร</Label>
        <Input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={initial.phone ?? ""} autoComplete="tel" placeholder="0812345678" aria-invalid={!!e.phone} />
        <p className="mt-1.5 text-[13px] text-muted">ช่างจะโทรหาเมื่อต้องการสอบถามหน้างาน เห็นได้เฉพาะช่างที่รับงานและเจ้าหน้าที่</p>
        <FieldError>{e.phone}</FieldError>
      </div>

      {mode === "setup" ? (
        <div className={cn("rounded-[16px] bg-white p-4", e.pdpa && "ring-2 ring-red-ink")}>
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-brand" size={20} aria-hidden />
            <div className="text-[13px] leading-relaxed text-muted">
              <p className="font-semibold text-ink">การคุ้มครองข้อมูลส่วนบุคคล (PDPA)</p>
              <p className="mt-1">
                เราเก็บชื่อ สถานะ คณะ และเบอร์โทรของคุณ เพื่อติดต่อกลับและติดตามงานซ่อมเท่านั้น รูปภาพที่แนบใช้ประกอบการซ่อม ข้อมูลจะไม่ถูกเผยแพร่ต่อบุคคลภายนอก
                และคุณขอแก้ไขข้อมูลได้ทุกเมื่อในหน้าโปรไฟล์
              </p>
            </div>
          </div>
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="pdpa"
              checked={pdpa}
              onChange={(ev) => setPdpa(ev.target.checked)}
              className="h-5 w-5 shrink-0 accent-[#5B2C83]"
              aria-invalid={!!e.pdpa}
            />
            <span className="text-[15px] font-medium">ฉันยอมรับการเก็บและใช้ข้อมูลตามที่ระบุ</span>
          </label>
          <FieldError>{e.pdpa}</FieldError>
        </div>
      ) : null}

      {state.message ? (
        <p role="status" className="rounded-[12px] bg-green-tint px-4 py-3 text-sm font-medium text-green-ink">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" block loading={pending} disabled={mode === "setup" && !pdpa}>
        {mode === "setup" ? "บันทึกและเริ่มใช้งาน" : "บันทึกการแก้ไข"}
      </Button>
      {mode === "setup" && !pdpa ? <p className="-mt-2 text-center text-[13px] text-muted">ติ๊กยอมรับ PDPA ด้านบนเพื่อบันทึก</p> : null}
    </form>
  );
}
