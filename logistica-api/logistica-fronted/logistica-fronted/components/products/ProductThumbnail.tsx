"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  imageUrl: string | null;
  name: string;
  size?: "sm" | "md";
  className?: string;
}

export function ProductThumbnail({ imageUrl, name, size = "sm", className }: Props) {
  const [errored, setErrored] = useState(false);
  const dim = size === "sm" ? "h-8 w-8" : "h-16 w-16";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-6 w-6";

  if (!imageUrl || errored) {
    return (
      <div
        className={cn(
          dim,
          "rounded bg-muted flex items-center justify-center shrink-0",
          className
        )}
      >
        <Package className={cn(iconSize, "text-muted-foreground")} />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      className={cn(dim, "rounded object-cover shrink-0", className)}
      onError={() => setErrored(true)}
    />
  );
}
