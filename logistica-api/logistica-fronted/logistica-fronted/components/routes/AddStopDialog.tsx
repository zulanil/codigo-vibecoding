"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { createRouteStop } from "@/lib/api/routes";
import type { RouteStopPayload } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";

const schema = z.object({
  stop_order: z.coerce.number().int().positive("Requerido"),
  address: z.string().min(1, "Requerido"),
  city: z.string().min(1, "Requerido"),
  estimated_arrival: z.string(),
  actual_arrival: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  routeId: number;
  open: boolean;
  onClose: () => void;
}

export function AddStopDialog({ routeId, open, onClose }: Props) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      stop_order: 0,
      address: "",
      city: "",
      estimated_arrival: "",
      actual_arrival: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: RouteStopPayload) => createRouteStop(routeId, payload),
    onSuccess: () => {
      toast.success("Parada agregada correctamente");
      queryClient.invalidateQueries({ queryKey: ["route", routeId] });
      form.reset();
      onClose();
    },
    onError: (error: AxiosError<Record<string, string[]>>) => {
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
    },
  });

  function handleSubmit(values: FormValues) {
    const payload: RouteStopPayload = {
      stop_order: values.stop_order,
      address: values.address,
      city: values.city,
      estimated_arrival: values.estimated_arrival === "" ? null : values.estimated_arrival,
      actual_arrival: values.actual_arrival === "" ? null : values.actual_arrival,
    };
    mutate(payload);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar parada</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="stop_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orden</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" step="1" placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Dirección completa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad</FormLabel>
                  <FormControl>
                    <Input placeholder="Ciudad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimated_arrival"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Llegada estimada{" "}
                    <span className="text-muted-foreground">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actual_arrival"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Llegada real{" "}
                    <span className="text-muted-foreground">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Agregando..." : "Agregar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
