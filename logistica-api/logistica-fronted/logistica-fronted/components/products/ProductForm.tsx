"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useRef, useState } from "react";
import { Package, Upload, X } from "lucide-react";
import { createProduct, updateProduct } from "@/lib/api/products";
import { getSuppliers } from "@/lib/api/suppliers";
import type { Product } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const decimalField = z
  .string()
  .min(1, "Requerido")
  .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Debe ser > 0");

const schema = z.object({
  supplier: z.string().min(1, "Requerido"),
  name: z.string().min(1, "Requerido"),
  sku: z.string().min(1, "Requerido"),
  description: z.string(),
  weight_kg: decimalField,
  length_cm: decimalField,
  width_cm: decimalField,
  height_cm: decimalField,
  unit_price: decimalField,
});

type FormValues = z.infer<typeof schema>;

interface Props {
  product?: Product;
}

export function ProductForm({ product }: Props) {
  const router = useRouter();
  const isEdit = !!product;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const currentImageUrl = isEdit ? (product.image_url ?? null) : null;
  const showCurrentImage = currentImageUrl && !removeImage && !imageFile;
  const showPreview = !!imageFile;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setRemoveImage(false);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setPreviewUrl(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const { data: suppliersData, isLoading: loadingSuppliers } = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: () => getSuppliers(),
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      supplier: product ? String(product.supplier) : "",
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      description: product?.description ?? "",
      weight_kg: product?.weight_kg ?? "",
      length_cm: product?.length_cm ?? "",
      width_cm: product?.width_cm ?? "",
      height_cm: product?.height_cm ?? "",
      unit_price: product?.unit_price ?? "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, supplier: Number(values.supplier) };
      if (isEdit) {
        const imageArg = imageFile ?? (removeImage ? null : undefined);
        return updateProduct(product.id, payload, imageArg);
      }
      return createProduct(payload, imageFile ?? undefined);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Producto actualizado" : "Producto creado");
      router.push("/products");
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

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => mutate(values))}
        className="space-y-4 max-w-lg"
      >
        <FormField
          control={form.control}
          name="supplier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proveedor</FormLabel>
              <Select
                value={field.value}
                onValueChange={(v) => field.onChange(v ?? "")}
                disabled={loadingSuppliers}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      loadingSuppliers
                        ? "Cargando proveedores..."
                        : "Seleccionar proveedor"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {suppliersData?.results.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del producto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input placeholder="SKU-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Descripción{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Textarea placeholder="Descripción del producto" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weight_kg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso (kg)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.001" placeholder="0.000" {...field} />
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
                  <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="length_cm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Largo (cm)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.1" placeholder="0.0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="width_cm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ancho (cm)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.1" placeholder="0.0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="height_cm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alto (cm)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.1" placeholder="0.0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium leading-none">
            Imagen{" "}
            <span className="font-normal text-muted-foreground">(opcional, máx 5 MB)</span>
          </p>
          <div className="flex items-center gap-4">
            {showCurrentImage ? (
              <img
                src={currentImageUrl!}
                alt="Imagen actual"
                className="h-16 w-16 rounded object-cover shrink-0"
              />
            ) : showPreview ? (
              <img
                src={previewUrl!}
                alt="Vista previa"
                className="h-16 w-16 rounded object-cover shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded bg-muted flex items-center justify-center shrink-0">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {showCurrentImage || showPreview ? "Cambiar imagen" : "Subir imagen"}
              </Button>
              {(showCurrentImage || showPreview) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Quitar imagen
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : isEdit ? "Actualizar" : "Crear producto"}
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
