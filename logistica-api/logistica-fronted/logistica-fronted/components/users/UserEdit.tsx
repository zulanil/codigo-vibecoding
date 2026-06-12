"use client";

import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/lib/api/users";
import { UserForm } from "./UserForm";

interface Props {
  id: number;
}

export function UserEdit({ id }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUser(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-destructive">Usuario no encontrado.</p>;
  }

  return <UserForm user={data} />;
}
