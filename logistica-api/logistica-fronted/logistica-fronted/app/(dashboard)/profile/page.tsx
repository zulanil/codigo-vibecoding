"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useAuthStore } from "@/lib/stores/auth";
import { getCurrentUser, updateProfile } from "@/lib/api/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { LogOut, Pencil, X } from "lucide-react";

const schema = z
  .object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email("Email inválido").or(z.literal("")),
    password: z.string(),
    confirm_password: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password && data.password.length < 8) {
      ctx.addIssue({ code: "custom", path: ["password"], message: "Mínimo 8 caracteres" });
    }
    if (data.password && data.password !== data.confirm_password) {
      ctx.addIssue({ code: "custom", path: ["confirm_password"], message: "Las contraseñas no coinciden" });
    }
  });

type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const username = useAuthStore((s) => s.username);
  const isSuperuser = useAuthStore((s) => s.isSuperuser);
  const groups = useAuthStore((s) => s.groups);
  const logout = useAuthStore((s) => s.logout);
  const refreshUserFromCookie = useAuthStore((s) => s.refreshUserFromCookie);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: getCurrentUser,
  });

  const roleLabel = !mounted
    ? "Usuario"
    : isSuperuser
    ? "Superadministrador"
    : groups.length > 0
    ? groups[0]
    : "Usuario";

  const initials = username ? username.slice(0, 2).toUpperCase() : "U";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      email: user?.email ?? "",
      password: "",
      confirm_password: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      const { confirm_password, password, ...rest } = values;
      return updateProfile(password ? { ...rest, password, confirm_password } : rest);
    },
    onSuccess: () => {
      toast.success("Perfil actualizado");
      queryClient.invalidateQueries({ queryKey: ["me"] });
      refreshUserFromCookie();
      setEditing(false);
      form.resetField("password");
      form.resetField("confirm_password");
    },
    onError: (error: AxiosError<Record<string, string[]>>) => {
      const data = error.response?.data;
      if (!data) { toast.error("Error inesperado"); return; }
      Object.entries(data).forEach(([field, messages]) => {
        if (field in schema.shape) {
          form.setError(field as keyof FormValues, { message: messages[0] });
        } else {
          toast.error(messages[0]);
        }
      });
    },
  });

  return (
    <div className="p-4 sm:p-6 max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Información de tu cuenta</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold select-none">
                {initials}
              </div>
              <div>
                <CardTitle className="text-xl">{username ?? "Usuario"}</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">{roleLabel}</p>
              </div>
            </div>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" />Editar
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); form.reset(); }}>
                <X className="h-4 w-4 mr-1" />Cancelar
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!editing ? (
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
              <InfoRow label="Usuario" value={username ?? "—"} />
              <InfoRow label="Nombre" value={[user?.first_name, user?.last_name].filter(Boolean).join(" ") || "—"} />
              <InfoRow label="Email" value={user?.email || "—"} />
              <InfoRow label="Contraseña" value="••••••••" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => mutate(v))} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="first_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl><Input placeholder="Ana" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="last_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl><Input placeholder="García" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="correo@ejemplo.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Cambiar contraseña <span className="font-normal">(opcional)</span></p>
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva contraseña</FormLabel>
                      <FormControl><Input type="password" placeholder="Mínimo 8 caracteres" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="confirm_password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar contraseña</FormLabel>
                      <FormControl><Input type="password" placeholder="Repite la contraseña" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </form>
            </Form>
          )}

          <Button variant="destructive" className="w-full gap-2" onClick={() => logout()}>
            <LogOut className="h-4 w-4" />Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
