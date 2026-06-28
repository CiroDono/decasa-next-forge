import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, CircleOff, Pencil, Power, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatARS } from "@/lib/format";
import { TRANSPORTISTA_LABEL } from "@/lib/shipping.functions";
import type { Transportista } from "@/lib/shipping.functions";

export const Route = createFileRoute("/_authenticated/admin/envios")({ component: AdminEnvios });

type ShippingRow = {
  id: string;
  transportista: Transportista;
  provincia: string | null;
  costo: number;
  label: string;
  activo: boolean;
  dias_estimados_min: number | null;
  dias_estimados_max: number | null;
};

const TRANSPORTISTA_ORDER: Transportista[] = ["retiro_local", "cadete", "correo_argentino", "andreani"];

function AdminEnvios() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery<ShippingRow[]>({
    queryKey: ["admin-shipping"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_options")
        .select("id, transportista, provincia, costo, label, activo, dias_estimados_min, dias_estimados_max")
        .order("transportista")
        .order("provincia");
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({ ...row, costo: Number(row.costo) })) as ShippingRow[];
    },
  });

  const grouped = TRANSPORTISTA_ORDER.map((transportista) => ({
    transportista,
    options: rows.filter((row) => row.transportista === transportista),
  })).filter((group) => group.options.length > 0);

  async function toggleActivo(row: ShippingRow) {
    const { error } = await supabase.from("shipping_options").update({ activo: !row.activo }).eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(row.activo ? "Opcion desactivada" : "Opcion activada");
    qc.invalidateQueries({ queryKey: ["admin-shipping"] });
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando configuracion de envios...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Truck className="size-5 text-primary" />
        <div>
          <h2 className="font-display text-xl">Tarifas de envio</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Edita costos, plazos y disponibilidad de cada opcion que aparece en el checkout.
          </p>
        </div>
      </div>

      {grouped.map(({ transportista, options }) => (
        <section key={transportista} className="border border-border bg-surface-elevated">
          <div className="px-4 py-3 bg-secondary/30 border-b border-border flex items-center gap-2">
            <Truck className="size-4 text-muted-foreground" />
            <span className="font-display text-sm tracking-wide">{TRANSPORTISTA_LABEL[transportista]}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {options.filter((option) => option.activo).length}/{options.length} activas
            </span>
          </div>
          <div className="divide-y divide-border">
            {options.map((row) => (
              <ShippingRow
                key={row.id}
                row={row}
                onToggle={toggleActivo}
                onSaved={() => qc.invalidateQueries({ queryKey: ["admin-shipping"] })}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ShippingRow({
  row,
  onToggle,
  onSaved,
}: {
  row: ShippingRow;
  onToggle: (row: ShippingRow) => void;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [costo, setCosto] = useState(String(row.costo));
  const [diasMin, setDiasMin] = useState(String(row.dias_estimados_min ?? ""));
  const [diasMax, setDiasMax] = useState(String(row.dias_estimados_max ?? ""));
  const [saving, setSaving] = useState(false);

  async function save() {
    const costoNum = Number(costo);
    const min = diasMin === "" ? null : Number(diasMin);
    const max = diasMax === "" ? null : Number(diasMax);
    if (!Number.isFinite(costoNum) || costoNum < 0) {
      toast.error("El costo debe ser un numero positivo.");
      return;
    }
    if ((min != null && (!Number.isInteger(min) || min < 0)) || (max != null && (!Number.isInteger(max) || max < 0))) {
      toast.error("Los dias deben ser numeros enteros positivos.");
      return;
    }
    if (min != null && max != null && min > max) {
      toast.error("El minimo de dias no puede ser mayor al maximo.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("shipping_options")
      .update({ costo: costoNum, dias_estimados_min: min, dias_estimados_max: max })
      .eq("id", row.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Tarifa actualizada");
    setEditing(false);
    onSaved();
  }

  function cancel() {
    setCosto(String(row.costo));
    setDiasMin(String(row.dias_estimados_min ?? ""));
    setDiasMax(String(row.dias_estimados_max ?? ""));
    setEditing(false);
  }

  return (
    <div className={`px-4 py-3 flex flex-wrap items-center gap-3 text-sm ${!row.activo ? "opacity-55" : ""}`}>
      <div className="flex-1 min-w-56">
        <div className="font-medium truncate">{row.label}</div>
        {!editing && (
          <div className="text-xs text-muted-foreground">
            {row.dias_estimados_min === 0 && row.dias_estimados_max === 0
              ? "Inmediato"
              : `${row.dias_estimados_min ?? "-"}-${row.dias_estimados_max ?? "-"} dias habiles`}
          </div>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            $
            <input
              type="number"
              min={0}
              step={100}
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
              className="w-24 border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            min
            <input
              type="number"
              min={0}
              value={diasMin}
              onChange={(e) => setDiasMin(e.target.value)}
              className="w-16 border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            max
            <input
              type="number"
              min={0}
              value={diasMax}
              onChange={(e) => setDiasMax(e.target.value)}
              className="w-16 border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
            />
          </label>
          <button type="button" onClick={save} disabled={saving} className="text-success hover:text-success/80 disabled:opacity-50" title="Guardar">
            <Check className="size-4" />
          </button>
          <button type="button" onClick={cancel} className="text-muted-foreground hover:text-destructive" title="Cancelar">
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="font-display text-base">{row.costo === 0 ? "Gratis" : formatARS(row.costo)}</span>
          <button type="button" onClick={() => setEditing(true)} className="text-muted-foreground hover:text-primary" title="Editar tarifa">
            <Pencil className="size-3.5" />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => onToggle(row)}
        className={`ml-auto shrink-0 ${row.activo ? "text-primary" : "text-muted-foreground"}`}
        title={row.activo ? "Desactivar" : "Activar"}
      >
        {row.activo ? <Power className="size-5" /> : <CircleOff className="size-5" />}
      </button>
    </div>
  );
}
