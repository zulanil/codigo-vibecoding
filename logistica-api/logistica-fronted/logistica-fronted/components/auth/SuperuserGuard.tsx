"use client";

import { useAuthStore } from "@/lib/stores/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function SuperuserGuard({ children }: { children: React.ReactNode }) {
  const isSuperuser = useAuthStore((s) => s.isSuperuser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!isAuthenticated || !isSuperuser)) {
      router.replace("/dashboard");
    }
  }, [mounted, isAuthenticated, isSuperuser, router]);

  return <>{children}</>;
}
