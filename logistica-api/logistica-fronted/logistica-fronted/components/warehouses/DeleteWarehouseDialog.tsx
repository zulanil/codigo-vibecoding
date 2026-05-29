"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteWarehouse } from "@/lib/api/warehouses";
import type { Warehouse } from "@/lib/types";
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
  warehouse: Warehouse | null;
  onClose: () => void;
}

export function DeleteWarehouseDialog({ warehouse, onClose }: Props) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteWarehouse(warehouse!.id),
    onSuccess: () => {
      toast.success("Almacén eliminado");
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      onClose();
    },
    onError: () => {
      toast.error("Error al eliminar el almacén");
    },
  });

  return (
    <Dialog open={!!warehouse} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar almacén</DialogTitle>
          <DialogDescription>
            ¿Eliminar <strong>{warehouse?.name}</strong>? Esta acción
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
