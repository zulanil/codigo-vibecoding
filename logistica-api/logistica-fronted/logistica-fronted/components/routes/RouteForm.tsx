"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { createRoute, updateRoute } from "@/lib/api/routes";
import { getTransports } from "@/lib/api/transports";
import { getWarehouses } from "@/lib/api/warehouses";
import type { Route } from "@/lib/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  transport: z.string().min(1, "Requerido"),
  origin_warehouse: z.string().min(1, "Requerido"),
  name: z.string().min(1, "Requerido"),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]),
  scheduled_date: z.string().min(1, "Requerido"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  route?: Route;
}

export function RouteForm({ route }: Props) {
  const router = useRouter();
  const isEdit = !!route;

  const { data: transportsData, isLoading: loadingTransports } = useQuery({
    queryKey: ["transports-list"],
    queryFn: () => getTransports(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: warehousesData, isLoading: loadingWarehouses } = useQuery({
    queryKey: ["warehouses-list"],
    queryFn: () => getWarehouses(),
    staleTime: 5 * 60 * 1000,
  });

  const isLoadingSelectors = loadingTransports || loadingWarehouses;

  useEffect(() => {
    if (!isLoadingSelectors && route) {
      form.reset({
        transport: String(route.transport),
        origin_warehouse: String(route.origin_warehouse),
        name: route.name,
        status: route.status,
        scheduled_date: route.scheduled_date,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingSelectors]);

  function buildPayload(values: FormValues) {
    return {
      ...values,
      transport: Number(values.transport),
      origin_warehouse: Number(values.origin_warehouse),
    };
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      transport: route ? String(route.transport) : "",
      origin_warehouse: route ? String(route.origin_warehouse) : "",
      name: route?.name ?? "",
      status: route?.status ?? "planned",
      scheduled_date: route?.scheduled_date ?? "",
    },
  });

  function handleError(error: AxiosError<Record<string, string[]>>) {
    const data = error.response?.data;
    if (!data) {
      toast.error("Error inesperado");
      return;
    }
    Object.entries(data).forEach(([field, messages]) => {
      if (field === "non_field_errors") {
        toast.error(messages[0]);
      } else if (field in schema.shape) {
        form.setError(field as keyof FormValues, { message: messages[0] });
      }
    });
  }

  const createMutation = useMutation({
    mutationFn: createRoute,
    onSuccess: () => {
      toast.success("Ruta creada correctamente");
      router.push("/routes");
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildPayload>) =>
      updateRoute(route!.id, payload),
    onSuccess: () => {
      toast.success("Ruta actualizada correctamente");
      router.push("/routes");
    },
    onError: handleError,
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoadingSelectors) {
    return (
      <div className="space-y-4 max-w-lg">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          const payload = buildPayload(values);
          if (isEdit) {
            updateMutation.mutate(payload);
          } else {
            createMutation.mutate(payload);
          }
        })}
        className="space-y-4 max-w-lg"
      >
        <FormField
          control={form.control}
          name="transport"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transporte</FormLabel>
              <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar transporte" />
                </SelectTrigger>
                <SelectContent>
                  {transportsData?.results.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.plate_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="origin_warehouse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Almacén de origen</FormLabel>
              <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar almacén" />
                </SelectTrigger>
                <SelectContent>
                  {warehousesData?.results.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre de la ruta" {...field} />
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
              <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planificada</SelectItem>
                  <SelectItem value="in_progress">En progreso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduled_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha programada</FormLabel>
              <DatePickerInput
                value={field.value}
                onChange={field.onChange}
                placeholder="Seleccionar fecha"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar"}
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
