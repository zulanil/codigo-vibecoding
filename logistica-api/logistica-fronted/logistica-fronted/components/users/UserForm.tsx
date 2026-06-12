"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { createUser, updateUser, getGroups } from "@/lib/api/users";
import type { AuthUser } from "@/lib/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    username: z.string().min(1, "Requerido"),
    email: z.string().email("Email inválido").or(z.literal("")),
    first_name: z.string(),
    last_name: z.string(),
    password: z.string(),
    is_active: z.boolean(),
    is_superuser: z.boolean(),
    groups: z.array(z.number()),
  })
  .superRefine((data, ctx) => {
    if (!data.password && data.username === "") {
      ctx.addIssue({ code: "custom", path: ["password"], message: "Requerido" });
    }
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  user?: AuthUser;
}

export function UserForm({ user }: Props) {
  const router = useRouter();
  const isEdit = !!user;

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: user?.username ?? "",
      email: user?.email ?? "",
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      password: "",
      is_active: user?.is_active ?? true,
      is_superuser: user?.is_superuser ?? false,
      groups: user?.groups.map((g) => g.id) ?? [],
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      const { password, ...rest } = values;
      if (isEdit) {
        return updateUser(user.id, password ? { ...rest, password } : rest);
      }
      return createUser({ ...rest, password: password ?? "" });
    },
    onSuccess: () => {
      toast.success(isEdit ? "Usuario actualizado" : "Usuario creado");
      router.push("/users");
    },
    onError: (error: AxiosError<Record<string, string[]>>) => {
      const data = error.response?.data;
      if (!data) { toast.error("Error inesperado"); return; }
      Object.entries(data).forEach(([field, messages]) => {
        if (field === "non_field_errors") {
          toast.error(messages[0]);
        } else if (field in schema.shape) {
          form.setError(field as keyof FormValues, { message: messages[0] });
        }
      });
    },
  });

  const selectedGroups = form.watch("groups");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => mutate(values))}
        className="space-y-4 max-w-lg"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de usuario</FormLabel>
              <FormControl>
                <Input placeholder="usuario123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre <span className="text-muted-foreground">(opcional)</span></FormLabel>
                <FormControl>
                  <Input placeholder="Ana" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido <span className="text-muted-foreground">(opcional)</span></FormLabel>
                <FormControl>
                  <Input placeholder="García" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email <span className="text-muted-foreground">(opcional)</span></FormLabel>
              <FormControl>
                <Input type="email" placeholder="correo@ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Contraseña{" "}
                {isEdit && (
                  <span className="text-muted-foreground">(dejar vacío para no cambiar)</span>
                )}
              </FormLabel>
              <FormControl>
                <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {groups.length > 0 && (
          <FormField
            control={form.control}
            name="groups"
            render={() => (
              <FormItem>
                <FormLabel>Roles</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {groups.map((group) => {
                    const checked = selectedGroups.includes(group.id);
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => {
                          const next = checked
                            ? selectedGroups.filter((id) => id !== group.id)
                            : [...selectedGroups, group.id];
                          form.setValue("groups", next);
                        }}
                        className="cursor-pointer"
                      >
                        <Badge
                          variant={checked ? "default" : "outline"}
                          className="transition-colors"
                        >
                          {group.name}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-3">
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className="sr-only">Activo</FormLabel>
                <FormControl>
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition-colors",
                      field.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    )}
                  >
                    Activo
                  </button>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_superuser"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className="sr-only">Superadmin</FormLabel>
                <FormControl>
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm transition-colors",
                      field.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    )}
                  >
                    Superadmin
                  </button>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : isEdit ? "Actualizar" : "Crear usuario"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
