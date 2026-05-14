import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminListPedidos, adminUpdatePedidoEstado } from "@/lib/admin.functions";
import { formatARS } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({ component: AdminPedidos });

const ESTADOS = ["pendiente", "pagado", "enviado", "entregado", "cancelado"] as const;

function AdminPedidos() {
  const qc = useQueryClient();
  const list = useServerFn(adminListPedidos);
  const update = useServerFn(adminUpdatePedidoEstado);
  const { data } = useQuery({ queryKey: ["admin-pedidos"], queryFn: () => list() });

  return (
    <div className="space-y-3">
      {data?.length === 0 && <p className="text-muted-foreground text-sm">Aún no hay pedidos.</p>}
      {data?.map((p) => (
        <details key={p.id} className="border border-border">
          <summary className="px-4 py-3 cursor-pointer flex flex-wrap items-center gap-3 justify-between">
            <div>
              <div className="font-mono text-xs text-muted-foreground">#{p.id.slice(0, 8)}</div>
              <div className="text-sm font-medium">{p.nombre} <span className="text-muted-foreground">— {p.email}</span></div>
              <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("es-AR")}</div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={p.estado}
                onClick={(e) => e.stopPropagation()}
                onChange={async (e) => {
                  await update({ data: { id: p.id, estado: e.target.value as any } });
                  toast.success("Estado actualizado");
                  qc.invalidateQueries({ queryKey: ["admin-pedidos"] });
                }}
                className="border border-border bg-background px-2 py-1 text-xs"
              >
                {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="font-display">{formatARS(Number(p.total))}</span>
            </div>
          </summary>
          <div className="px-4 py-3 border-t border-border bg-secondary/30 text-sm">
            <p><strong>Tel:</strong> {p.telefono}</p>
            {p.direccion && (
              <p><strong>Envío:</strong> {(p.direccion as any).calle} {(p.direccion as any).numero}, {(p.direccion as any).ciudad}, {(p.direccion as any).provincia} (CP {(p.direccion as any).codigo_postal})</p>
            )}
            {p.mp_payment_id && <p className="text-xs text-muted-foreground">MP: {p.mp_payment_id}</p>}
            <ul className="mt-2 space-y-1">
              {p.pedido_items?.map((it: any) => (
                <li key={it.id}>{it.cantidad}× {it.nombre} — {formatARS(Number(it.subtotal))}</li>
              ))}
            </ul>
          </div>
        </details>
      ))}
    </div>
  );
}
