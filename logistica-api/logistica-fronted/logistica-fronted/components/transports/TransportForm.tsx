"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { createTransport, updateTransport } from "@/lib/api/transports";
import { getDrivers } from "@/lib/api/drivers";
import type { Transport } from "@/lib/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  driver: z.string(),
  plate_number: z.string().min(1, "Requerido"),
  vehicle_type: z.enum(["truck", "van", "motorcycle"]),
  capacity_kg: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Debe ser > 0"),
  status: z.enum(["available", "in_use", "maintenance"]),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  transport?: Transport;
}

export function TransportForm({ transport }: Props) {
  const router = useRouter();
  const isEdit = !!transport;

  const { data: driversData, isLoading: loadingDrivers } = useQuery({
    queryKey: ["drivers-list"],
    queryFn: () => getDrivers(),
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      driver: transport?.driver !== null && transport?.driver !== undefined
        ? String(transport.driver)
        : "",
      plate_number: transport?.plate_number ?? "",
      vehicle_type: transport?.vehicle_type ?? "truck",
      capacity_kg: transport?.capacity_kg ?? "",
      status: transport?.status ?? "available",
    },
  });

  useEffect(() => {
    if (!loadingDrivers && transport) {
      form.reset({
        driver: transport.driver !== null && transport.driver !== undefined
          ? String(transport.driver)
          : "",
        plate_number: transport.plate_number,
        vehicle_type: transport.vehicle_type,
        capacity_kg: transport.capacity_kg,
        status: transport.status,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingDrivers]);

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        driver: Number(values.driver) || null,
      };
      return isEdit
        ? updateTransport(transport.id, payload)
        : createTransport(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Transporte actualizado" : "Transporte creado");
      router.push("/transports");
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

  if (loadingDrivers) {
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
        onSubmit={form.handleSubmit((values) => mutate(values))}
        className="space-y-4 max-w-lg"
      >
        <FormField
          control={form.control}
          name="driver"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conductor <span className="text-muted-foreground">(opcional)</span></FormLabel>
              <Select
                value={field.value}
                onValueChange={(v) => field.onChange(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      loadingDrivers ? "Cargando conductores..." : "Sin asignar"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {driversData?.results.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.license_number}
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
          name="plate_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placa</FormLabel>
              <FormControl>
                <Input placeholder="ABC-123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vehicle_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de vehículo</FormLabel>
              <Select
                value={field.value}
                onValueChange={(v) => field.onChange(v ?? "truck")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">Camión</SelectItem>
                  <SelectItem value="van">Furgoneta</SelectItem>
                  <SelectItem value="motorcycle">Moto</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacity_kg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidad (kg)</FormLabel>
              <FormControl>
                <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
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
              <Select
                value={field.value}
                onValueChange={(v) => field.onChange(v ?? "available")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="in_use">En uso</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : isEdit ? "Actualizar" : "Crear transporte"}
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
