"use client";

import { Eye, EyeOff } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { FieldError, Label } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";

export function LoginForm({ expired }: { expired: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [username, setUsername] = useState(state.username ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  // Users type only the part before "@"; anything from "@" onward is stripped.
  const onUsername = (v: string) => setUsername(v.split("@")[0].replace(/\s/g, ""));

  return (
    <>
      {expired ? (
        <p className="mt-6 rounded-[12px] bg-orange-tint px-4 py-3 text-sm text-orange-ink" role="status">
          ไม่มีการใช้งานเกิน 30 นาที ระบบจึงออกจากระบบให้อัตโนมัติ กรุณาเข้าสู่ระบบอีกครั้ง
        </p>
      ) : null}

      <form
        className="mt-8 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          startTransition(() => action(data));
        }}
      >
        <div>
          <Label htmlFor="username">CMU Account</Label>
          <div
            className={cn(
              "flex min-h-12 items-center rounded-[12px] bg-white ring-1 ring-transparent transition focus-within:ring-2 focus-within:ring-brand",
              state.error && "ring-2 ring-red-ink",
            )}
          >
            <input
              id="username"
              name="username"
              value={username}
              onChange={(e) => onUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="email"
              placeholder="firstname.lastname"
              className="min-w-0 flex-1 bg-transparent py-3 pl-3.5 text-[16px] outline-none placeholder:text-[#8a8a90]"
              aria-describedby="username-suffix"
              aria-invalid={!!state.error}
            />
            <span id="username-suffix" className="select-none pr-3.5 text-[16px] text-muted" aria-label="โดเมน @cmu.ac.th">
              @cmu.ac.th
            </span>
          </div>
        </div>

        <div>
          <Label htmlFor="password">รหัสผ่าน</Label>
          <div
            className={cn(
              "flex min-h-12 items-center rounded-[12px] bg-white ring-1 ring-transparent transition focus-within:ring-2 focus-within:ring-brand",
              state.error && "ring-2 ring-red-ink",
            )}
          >
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="min-w-0 flex-1 bg-transparent py-3 pl-3.5 text-[16px] outline-none"
              aria-invalid={!!state.error}
              aria-describedby={state.error ? "login-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="inline-flex h-11 w-11 items-center justify-center text-muted"
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <FieldError id="login-error">{state.error}</FieldError>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={() => setForgotOpen(true)} className="min-h-11 px-1 text-sm font-semibold text-brand">
            ลืมรหัสผ่าน?
          </button>
        </div>

        <Button type="submit" size="lg" block loading={pending}>
          {pending ? "กำลังเข้าสู่ระบบ" : "เข้าสู่ระบบ"}
        </Button>
      </form>

      <Sheet
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="ลืมรหัสผ่าน?"
        footer={
          <Button block variant="secondary" onClick={() => setForgotOpen(false)}>
            เข้าใจแล้ว
          </Button>
        }
      >
        <p className="text-[15px] leading-relaxed">กรุณาติดต่อ ITSC มช. เพื่อรีเซ็ตรหัสผ่าน</p>
        <p className="mt-2 text-sm text-muted">ระบบแจ้งซ่อมใช้ CMU Account เดียวกับบริการอื่นของมหาวิทยาลัย จึงไม่สามารถรีเซ็ตรหัสผ่านจากที่นี่ได้</p>
      </Sheet>
    </>
  );
}
