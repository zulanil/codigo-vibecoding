"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Settings } from "lucide-react";
import {
  getGroups, createGroup, updateGroup, deleteGroup,
  getPermissions, updateGroup as patchGroup,
} from "@/lib/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { AuthGroup, AuthPermission } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODULE_LABELS: Record<string, string> = {
  customers: "Clientes",
  suppliers: "Proveedores",
  warehouses: "Almacenes",
  products: "Productos",
  drivers: "Conductores",
  transport: "Transportes",
  routes: "Rutas",
  shipments: "Envíos",
};

const ACTION_LABELS: Record<string, string> = {
  view: "Ver",
  add: "Crear",
  change: "Editar",
  delete: "Eliminar",
};

function getAction(codename: string): string {
  for (const action of ["view", "add", "change", "delete"]) {
    if (codename.startsWith(action + "_")) return action;
  }
  return codename;
}

function groupPermissionsByModule(permissions: AuthPermission[]) {
  const grouped: Record<string, AuthPermission[]> = {};
  for (const perm of permissions) {
    if (!grouped[perm.module]) grouped[perm.module] = [];
    grouped[perm.module].push(perm);
  }
  return grouped;
}

interface PermissionEditorProps {
  group: AuthGroup;
  allPermissions: AuthPermission[];
  onClose: () => void;
}

function PermissionEditor({ group, allPermissions, onClose }: PermissionEditorProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(group.name);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(group.permissions.map((p) => p.id))
  );

  const grouped = groupPermissionsByModule(allPermissions);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      patchGroup(group.id, name.trim(), [...selectedIds]),
    onSuccess: () => {
      toast.success("Grupo actualizado");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: () => toast.error("Error al actualizar el grupo"),
  });

  function togglePerm(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleModule(module: string, perms: AuthPermission[]) {
    const allSelected = perms.every((p) => selectedIds.has(p.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => allSelected ? next.delete(p.id) : next.add(p.id));
      return next;
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar grupo</DialogTitle>
          <DialogDescription>
            Configura el nombre y los permisos de este rol.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Nombre del grupo</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-sm" />
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Permisos por módulo</p>
            <div className="space-y-3">
              {Object.entries(grouped).map(([module, perms]) => {
                const allSelected = perms.every((p) => selectedIds.has(p.id));
                const someSelected = perms.some((p) => selectedIds.has(p.id));
                return (
                  <div key={module} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {MODULE_LABELS[module] ?? module}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleModule(module, perms)}
                        className={cn(
                          "text-xs px-2 py-0.5 rounded border transition-colors",
                          allSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : someSelected
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "border-border text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {allSelected ? "Quitar todos" : "Seleccionar todos"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["view", "add", "change", "delete"].map((action) => {
                        const perm = perms.find((p) => getAction(p.codename) === action);
                        if (!perm) return null;
                        const active = selectedIds.has(perm.id);
                        return (
                          <button
                            key={perm.id}
                            type="button"
                            onClick={() => togglePerm(perm.id)}
                            className={cn(
                              "rounded-md border px-3 py-1.5 text-xs transition-colors",
                              active
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border bg-background hover:bg-muted text-muted-foreground"
                            )}
                          >
                            {ACTION_LABELS[action] ?? action}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={() => mutate()} disabled={isPending || !name.trim()}>
            {isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GroupTable() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editingGroup, setEditingGroup] = useState<AuthGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<AuthGroup | null>(null);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
  });

  const { data: allPermissions = [] } = useQuery({
    queryKey: ["permissions"],
    queryFn: getPermissions,
  });

  const createMutation = useMutation({
    mutationFn: () => createGroup(newName.trim()),
    onSuccess: () => {
      toast.success("Grupo creado");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setNewName("");
    },
    onError: () => toast.error("Error al crear el grupo"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGroup(groupToDelete!.id),
    onSuccess: () => {
      toast.success("Grupo eliminado");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setGroupToDelete(null);
    },
    onError: () => toast.error("Error al eliminar el grupo"),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 max-w-sm">
        <Input
          placeholder="Nombre del nuevo grupo..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) createMutation.mutate();
          }}
        />
        <Button onClick={() => createMutation.mutate()} disabled={!newName.trim() || createMutation.isPending}>
          <Plus className="h-4 w-4" />Crear
        </Button>
      </div>

      <div className="rounded-md border max-w-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del rol</TableHead>
              <TableHead>Permisos asignados</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {[1, 2, 3].map((j) => (
                    <TableCell key={j}><div className="h-4 w-full animate-pulse rounded bg-muted" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-16 text-center text-muted-foreground text-sm">
                  No hay grupos. Crea uno arriba.
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>
                    {group.permissions.length === 0 ? (
                      <span className="text-muted-foreground text-sm">Sin permisos</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(
                          group.permissions.reduce((acc, p) => {
                            const mod = MODULE_LABELS[p.module] ?? p.module;
                            acc[mod] = (acc[mod] ?? 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([mod, count]) => (
                          <Badge key={mod} variant="secondary" className="text-xs">
                            {mod} ({count})
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingGroup(group)}
                        title="Editar permisos"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setGroupToDelete(group)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingGroup && (
        <PermissionEditor
          group={editingGroup}
          allPermissions={allPermissions}
          onClose={() => setEditingGroup(null)}
        />
      )}

      <Dialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar grupo</DialogTitle>
            <DialogDescription>
              ¿Eliminar <strong>{groupToDelete?.name}</strong>? Los usuarios perderán este rol.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupToDelete(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
