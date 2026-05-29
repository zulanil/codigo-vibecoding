"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteDriver } from "@/lib/api/drivers";
import type { Driver } from "@/lib/types";
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
  driver: Driver | null;
  onClose: () => void;
}

export function DeleteDriverDialog({ driver, onClose }: Props) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteDriver(driver!.id),
    onSuccess: () => {
      toast.success("Conductor eliminado");
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      onClose();
    },
    onError: () => {
      toast.error("Error al eliminar el conductor");
    },
  });

  return (
    <Dialog open={!!driver} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar conductor</DialogTitle>
          <DialogDescription>
            ¿Eliminar conductor con licencia <strong>{driver?.license_number}</strong>? Esta acción
            desactivará el registro.
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
            {isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
