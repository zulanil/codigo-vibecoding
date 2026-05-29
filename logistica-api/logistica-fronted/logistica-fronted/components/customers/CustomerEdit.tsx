"use client";

import { useQuery } from "@tanstack/react-query";
import { getCustomer } from "@/lib/api/customers";
import { CustomerForm } from "./CustomerForm";

interface Props {
  id: number;
}

export function CustomerEdit({ id }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => getCustomer(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-destructive">Cliente no encontrado.</p>;
  }

  return <CustomerForm customer={data} />;
}
