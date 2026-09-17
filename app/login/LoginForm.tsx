"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Eye, EyeOff, Info, KeyRound } from "lucide-react";
import { startTransition, useActionState, useRef, useState } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { FieldError, Label } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";

const TEST_ACCOUNTS = [
  { username: "student01", role: "ผู้แจ้ง · นักศึกษา" },
  { username: "staff01", role: "ผู้แจ้ง · บุคลากร" },
  { username: "tech01", role: "ช่าง · ไฟฟ้า/แอร์" },
  { username: "tech02", role: "ช่าง · ประปา/อาคาร" },
  { username: "admin01", role: "ผู้ดูแลระบบ" },
];

export function LoginForm({ expired }: { expired: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [username, setUsername] = useState(state.username ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Users type only the part before "@"; anything from "@" onward is stripped.
  const onUsername = (v: string) => setUsername(v.split("@")[0].replace(/\s/g, ""));

  const fill = (u: string) => {
    setUsername(u);
    setPassword("demo1234");
    passwordRef.current?.focus();
  };

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
              ref={passwordRef}
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

      <p className="mt-6 flex gap-2.5 rounded-[12px] bg-white px-4 py-3 text-[13px] leading-relaxed text-muted">
        <Info size={16} className="mt-0.5 shrink-0 text-orange-ink" aria-hidden />
        <span>ต้นแบบสำหรับการนำเสนอ — กรุณาใช้บัญชีทดสอบ ห้ามกรอกรหัสผ่าน CMU จริง</span>
      </p>

      <div className="mt-3 overflow-hidden rounded-[16px] bg-white">
        <button
          type="button"
          onClick={() => setAccountsOpen((o) => !o)}
          className="flex min-h-12 w-full items-center gap-3 px-4 text-left"
          aria-expanded={accountsOpen}
        >
          <KeyRound size={18} className="text-brand" aria-hidden />
          <span className="flex-1 text-[15px] font-semibold">บัญชีทดสอบ</span>
          <motion.span animate={{ rotate: accountsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={18} className="text-muted" aria-hidden />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {accountsOpen ? (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
              <p className="px-4 pb-2 text-[13px] text-muted">
                รหัสผ่านทุกบัญชี: <span className="font-semibold text-ink">demo1234</span> · แตะเพื่อกรอกอัตโนมัติ
              </p>
              <ul>
                {TEST_ACCOUNTS.map((a) => (
                  <li key={a.username} className="border-t border-line">
                    <button type="button" onClick={() => fill(a.username)} className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left hover:bg-[#fafafb]">
                      <span className="tabular-nums text-[14px]">{a.username}</span>
                      <span className="text-[13px] text-muted">{a.role}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

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
