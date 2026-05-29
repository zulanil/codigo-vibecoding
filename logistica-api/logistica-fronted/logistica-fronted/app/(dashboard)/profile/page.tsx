"use client";

import { useAuthStore } from "@/lib/stores/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";

export default function ProfilePage() {
  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);

  const initials = username ? username.slice(0, 2).toUpperCase() : "U";

  return (
    <div className="p-4 sm:p-6 max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Información de tu cuenta</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold select-none">
              {initials}
            </div>
            <div>
              <CardTitle className="text-xl">{username ?? "Usuario"}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Administrador</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Usuario</p>
                <p className="text-sm font-medium">{username ?? "—"}</p>
              </div>
            </div>
          </div>

          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
