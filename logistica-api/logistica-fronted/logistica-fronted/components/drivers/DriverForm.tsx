"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { createDriver, updateDriver } from "@/lib/api/drivers";
import type { Driver } from "@/lib/types";
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
import { cn } from "@/lib/utils";

const schema = z.object({
  user: z.coerce.number().int().positive("Requerido"),
  license_number: z.string().min(1, "Requerido"),
  phone: z.string().min(1, "Requerido"),
  status: z.enum(["available", "on_route", "off_duty"]),
});

type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  { label: "Disponible", value: "available" as const },
  { label: "En ruta", value: "on_route" as const },
  { label: "No disponible", value: "off_duty" as const },
];

interface Props {
  driver?: Driver;
}

export function DriverForm({ driver }: Props) {
  const router = useRouter();
  const isEdit = !!driver;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      user: driver?.user ?? (undefined as unknown as number),
      license_number: driver?.license_number ?? "",
      phone: driver?.phone ?? "",
      status: driver?.status ?? "available",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit ? updateDriver(driver.id, values) : createDriver(values),
    onSuccess: () => {
      toast.success(isEdit ? "Conductor actualizado" : "Conductor creado");
      router.push("/drivers");
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

  const selectedStatus = form.watch("status");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => mutate(values))}
        className="space-y-4 max-w-lg"
      >
        <FormField
          control={form.control}
          name="user"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID de usuario</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="ID del usuario del sistema"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="license_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de licencia</FormLabel>
              <FormControl>
                <Input placeholder="Ej. B2-12345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input placeholder="+57 300 000 0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <div className="flex gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
                      selectedStatus === opt.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : isEdit ? "Actualizar" : "Crear conductor"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
