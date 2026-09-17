"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const [pending, start] = useTransition();
  return (
    <Button variant="danger" block loading={pending} onClick={() => start(() => logout())}>
      <LogOut size={18} aria-hidden />
      ออกจากระบบ
    </Button>
  );
}
