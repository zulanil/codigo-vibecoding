"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deactivateUser } from "@/lib/api/users";
import type { AuthUser } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  user: AuthUser | null;
  onClose: () => void;
}

export function DeactivateUserDialog({ user, onClose }: Props) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => deactivateUser(user!.id),
    onSuccess: () => {
      toast.success("Usuario desactivado");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: () => {
      toast.error("Error al desactivar el usuario");
    },
  });

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desactivar usuario</DialogTitle>
          <DialogDescription>
            ¿Desactivar a <strong>{user?.username}</strong>? El usuario no podrá
            iniciar sesión pero sus datos se conservan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutate()}
            disabled={isPending}
          >
            {isPending ? "Desactivando..." : "Desactivar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
