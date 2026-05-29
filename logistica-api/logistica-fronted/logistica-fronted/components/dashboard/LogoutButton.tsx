"use client";

import { LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
      onClick={() => logout()}
    >
      <LogOut className="h-4 w-4" />
      Cerrar sesión
    </Button>
  );
}
