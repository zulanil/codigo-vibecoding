"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { createShipment, updateShipment } from "@/lib/api/shipments";
import { getCustomers } from "@/lib/api/customers";
import { getWarehouses } from "@/lib/api/warehouses";
import { getRoutes } from "@/lib/api/routes";
import type { Shipment, ShipmentPayload } from "@/lib/types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  customer: z.string().min(1, "Requerido"),
  origin_warehouse: z.string().min(1, "Requerido"),
  route: z.string(),
  status: z.enum(["pending", "assigned", "in_transit", "delivered", "cancelled"]),
  origin_address: z.string().min(1, "Requerido"),
  destination_address: z.string().min(1, "Requerido"),
  scheduled_delivery_date: z.string().min(1, "Requerido"),
  weight_kg: z.string().min(1, "Requerido"),
  declared_value: z.string().min(1, "Requerido"),
  shipping_cost: z.string().min(1, "Requerido"),
  notes: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  shipment?: Shipment;
}

export function ShipmentForm({ shipment }: Props) {
  const router = useRouter();
  const isEdit = !!shipment;

  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers-list"],
    queryFn: () => getCustomers(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: warehousesData, isLoading: loadingWarehouses } = useQuery({
    queryKey: ["warehouses-list"],
    queryFn: () => getWarehouses(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: routesData, isLoading: loadingRoutes } = useQuery({
    queryKey: ["routes-list"],
    queryFn: () => getRoutes(),
    staleTime: 5 * 60 * 1000,
  });

  const isLoadingSelectors = loadingCustomers || loadingWarehouses || loadingRoutes;

  const form = useForm<FormValues>({

    resolver: zodResolver(schema),
    defaultValues: {
      customer: shipment ? String(shipment.customer) : "",
      origin_warehouse: shipment ? String(shipment.origin_warehouse) : "",
      route: shipment
        ? shipment.route !== null
          ? String(shipment.route)
          : ""
        : "",
      status: shipment?.status ?? "pending",
      origin_address: shipment?.origin_address ?? "",
      destination_address: shipment?.destination_address ?? "",
      scheduled_delivery_date: shipment?.scheduled_delivery_date ?? "",
      weight_kg: shipment?.weight_kg ?? "",
      declared_value: shipment?.declared_value ?? "",
      shipping_cost: shipment?.shipping_cost ?? "",
      notes: shipment?.notes ?? "",
    },
  });

  useEffect(() => {
    if (!isLoadingSelectors && shipment) {
      form.reset({
        customer: String(shipment.customer),
        origin_warehouse: String(shipment.origin_warehouse),
        route: shipment.route !== null ? String(shipment.route) : "",
        status: shipment.status,
        origin_address: shipment.origin_address,
        destination_address: shipment.destination_address,
        scheduled_delivery_date: shipment.scheduled_delivery_date ?? "",
        weight_kg: shipment.weight_kg,
        declared_value: shipment.declared_value,
        shipping_cost: shipment.shipping_cost,
        notes: shipment.notes ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingSelectors]);

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

  function buildPayload(values: FormValues): ShipmentPayload {
    return {
      ...values,
      customer: Number(values.customer),
      origin_warehouse: Number(values.origin_warehouse),
      route: values.route === "" ? null : Number(values.route),
    };
  }

  const createMutation = useMutation({
    mutationFn: createShipment,
    onSuccess: () => {
      toast.success("Envío creado correctamente");
      router.push("/shipments");
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: ShipmentPayload) =>
      updateShipment(shipment!.id, payload),
    onSuccess: () => {
      toast.success("Envío actualizado correctamente");
      router.push("/shipments");
    },
    onError: handleError,
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoadingSelectors) {
    return (
      <div className="space-y-4 max-w-lg">
        {Array.from({ length: 8 }).map((_, i) => (
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
          name="customer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customersData?.results.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
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
          name="route"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Ruta{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </FormLabel>
              <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin ruta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin ruta</SelectItem>
                  {routesData?.results.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                El conductor se asigna automáticamente a través del transporte vinculado a la ruta seleccionada.
              </FormDescription>
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
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="assigned">Asignado</SelectItem>
                  <SelectItem value="in_transit">En tránsito</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="origin_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección de origen</FormLabel>
              <FormControl>
                <Textarea placeholder="Dirección completa de origen" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="destination_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección de destino</FormLabel>
              <FormControl>
                <Textarea placeholder="Dirección completa de destino" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduled_delivery_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de entrega programada</FormLabel>
              <DatePickerInput
                value={field.value}
                onChange={field.onChange}
                placeholder="Seleccionar fecha"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weight_kg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Peso (kg)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="declared_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor declarado</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="shipping_cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Costo de envío</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Monto cobrado al cliente por este envío. Lo define el operador según la tarifa aplicable (distancia, peso, tipo de servicio).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Notas{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Textarea placeholder="Notas adicionales" {...field} />
              </FormControl>
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
