import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminListUsuarios, adminToggleAdmin } from "@/lib/admin.functions";
import { Shield, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({ component: AdminUsuarios });

function AdminUsuarios() {
  const qc = useQueryClient();
  const list = useServerFn(adminListUsuarios);
  const toggle = useServerFn(adminToggleAdmin);
  const { data } = useQuery({ queryKey: ["admin-usuarios"], queryFn: () => list() });

  async function flip(uid: string, isAdmin: boolean) {
    await toggle({ data: { user_id: uid, make_admin: !isAdmin } });
    toast.success(isAdmin ? "Admin removido" : "Admin asignado");
    qc.invalidateQueries({ queryKey: ["admin-usuarios"] });
  }

  return (
    <div className="border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-secondary-foreground">
          <tr>
            <th className="text-left px-3 py-2">Nombre</th>
            <th className="text-left px-3 py-2 hidden md:table-cell">Teléfono</th>
            <th className="text-left px-3 py-2 hidden md:table-cell">Registro</th>
            <th className="text-left px-3 py-2">Rol</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {data?.map((u) => {
            const isAdmin = u.roles.includes("admin");
            return (
              <tr key={u.id} className="border-t border-border">
                <td className="px-3 py-2">{u.nombre || <span className="text-muted-foreground">—</span>}</td>
                <td className="px-3 py-2 hidden md:table-cell text-muted-foreground">{u.telefono ?? "—"}</td>
                <td className="px-3 py-2 hidden md:table-cell text-muted-foreground">{new Date(u.created_at).toLocaleDateString("es-AR")}</td>
                <td className="px-3 py-2">
                  {isAdmin
                    ? <span className="bg-primary/15 text-primary px-2 py-0.5 text-xs">admin</span>
                    : <span className="text-muted-foreground text-xs">user</span>}
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => flip(u.id, isAdmin)} className="text-xs flex items-center gap-1 hover:text-primary ml-auto">
                    {isAdmin ? <><ShieldOff className="size-3.5" /> Quitar admin</> : <><Shield className="size-3.5" /> Hacer admin</>}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
