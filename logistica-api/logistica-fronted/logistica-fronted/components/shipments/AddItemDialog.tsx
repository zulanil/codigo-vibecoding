"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { createShipmentItem } from "@/lib/api/shipments";
import { getProducts } from "@/lib/api/products";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import type { ShipmentProductPayload } from "@/lib/types";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  product: z.string().min(1, "Requerido"),
  quantity: z.coerce.number().int().positive("Debe ser mayor a 0"),
  unit_price: z.string().min(1, "Requerido"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  shipmentId: number;
  open: boolean;
  onClose: () => void;
}

export function AddItemDialog({ shipmentId, open, onClose }: Props) {
  const queryClient = useQueryClient();

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["products-list"],
    queryFn: () => getProducts(),
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      product: "",
      quantity: "" as unknown as number,
      unit_price: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: ShipmentProductPayload) =>
      createShipmentItem(shipmentId, payload),
    onSuccess: () => {
      toast.success("Producto agregado correctamente");
      queryClient.invalidateQueries({ queryKey: ["shipment", shipmentId] });
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
    const payload: ShipmentProductPayload = {
      product: Number(values.product),
      quantity: values.quantity,
      unit_price: values.unit_price,
    };
    mutate(payload);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar producto al envío</DialogTitle>
        </DialogHeader>

        {loadingProducts ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Producto</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productsData?.results.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            <div className="flex items-center gap-2">
                              <ProductThumbnail imageUrl={p.image_url} name={p.name} />
                              <span>{p.name} ({p.sku})</span>
                            </div>
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
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio unitario</FormLabel>
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
        )}
      </DialogContent>
    </Dialog>
  );
}
