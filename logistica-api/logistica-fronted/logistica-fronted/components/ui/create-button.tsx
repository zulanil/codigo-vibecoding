"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { usePermission } from "@/lib/hooks/usePermission";

interface Props {
  permission: string;
  href: string;
  label: string;
}

export function CreateButton({ permission, href, label }: Props) {
  const canCreate = usePermission(permission);
  if (!canCreate) return null;
  return (
    <Link href={href} className={buttonVariants()}>
      <Plus className="h-4 w-4" />{label}
    </Link>
  );
}
