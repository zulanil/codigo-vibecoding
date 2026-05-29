"use client";

import { useQuery } from "@tanstack/react-query";
import { getProduct } from "@/lib/api/products";
import { ProductForm } from "./ProductForm";

interface Props {
  id: number;
}

export function ProductEdit({ id }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-destructive">Producto no encontrado.</p>;
  }

  return <ProductForm product={data} />;
}
