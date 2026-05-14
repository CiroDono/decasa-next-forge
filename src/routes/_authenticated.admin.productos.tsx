import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { adminListProductos, adminUpsertProducto, adminDeleteProducto, adminListCategorias } from "@/lib/admin.functions";
import { formatARS } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/productos")({ component: AdminProductos });

type ProductoForm = {
  id?: number; nombre: string; descripcion: string; categoria: string; grupo: string;
  sku: string; precio: number; stock: number;
};
const empty: ProductoForm = { nombre: "", descripcion: "", categoria: "", grupo: "", sku: "", precio: 0, stock: 0 };

function AdminProductos() {
  const qc = useQueryClient();
  const list = useServerFn(adminListProductos);
  const upsert = useServerFn(adminUpsertProducto);
  const del = useServerFn(adminDeleteProducto);
  const listCategorias = useServerFn(adminListCategorias);

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ProductoForm | null>(null);

  const { data } = useQuery({
    queryKey: ["admin-productos", q, page],
    queryFn: () => list({ data: { q: q || null, page } }),
  });

  const { data: categorias } = useQuery({
    queryKey: ["admin-categorias"],
    queryFn: () => listCategorias(),
  });

  async function save(v: ProductoForm) {
    await upsert({ data: { ...v, descripcion: v.descripcion || null, categoria: v.categoria || null, grupo: v.grupo || null, sku: v.sku || null, precio: Number(v.precio), stock: Number(v.stock) } });
    toast.success("Producto guardado");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-productos"] });
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar producto?")) return;
    await del({ data: { id } });
    toast.success("Eliminado");
    qc.invalidateQueries({ queryKey: ["admin-productos"] });
  }

  return (
    <div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar producto..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border border-border bg-background outline-none focus:border-primary text-sm"
          />
        </div>
        <button onClick={() => setEditing({ ...empty })} className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium flex items-center gap-2">
          <Plus className="size-4" /> Nuevo
        </button>
      </div>

      <div className="border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-secondary-foreground">
            <tr>
              <th className="text-left px-3 py-2">Nombre</th>
              <th className="text-left px-3 py-2 hidden md:table-cell">SKU</th>
              <th className="text-left px-3 py-2 hidden lg:table-cell">Categoría</th>
              <th className="text-right px-3 py-2">Precio</th>
              <th className="text-right px-3 py-2">Stock</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {data?.rows.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-3 py-2">{p.nombre}</td>
                <td className="px-3 py-2 hidden md:table-cell text-muted-foreground">{p.sku}</td>
                <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground">{p.categoria}</td>
                <td className="px-3 py-2 text-right">{formatARS(Number(p.precio ?? 0))}</td>
                <td className={`px-3 py-2 text-right ${(p.stock ?? 0) <= 5 ? "text-warning" : ""}`}>{p.stock ?? 0}</td>
                <td className="px-3 py-2 flex gap-1 justify-end">
                  <button onClick={() => setEditing({
                    id: p.id, nombre: p.nombre ?? "", descripcion: p.descripcion ?? "", categoria: p.categoria ?? "",
                    grupo: p.grupo ?? "", sku: p.sku ?? "", precio: Number(p.precio ?? 0), stock: p.stock ?? 0,
                  })} className="p-1.5 hover:text-primary"><Edit className="size-4" /></button>
                  <button onClick={() => remove(p.id)} className="p-1.5 hover:text-destructive"><Trash2 className="size-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.count > data.pageSize && (
        <div className="flex justify-between items-center mt-4 text-sm">
          <span className="text-muted-foreground">{data.count} productos</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border border-border disabled:opacity-30">Anterior</button>
            <span className="px-3 py-1">Pág {page}</span>
            <button disabled={page * data.pageSize >= data.count} onClick={() => setPage(page + 1)} className="px-3 py-1 border border-border disabled:opacity-30">Siguiente</button>
          </div>
        </div>
      )}

      {editing && <ProductoModal value={editing} categorias={categorias ?? []} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function ProductoModal({ value, categorias, onClose, onSave }: { value: ProductoForm; categorias: string[]; onClose: () => void; onSave: (v: ProductoForm) => Promise<void> }) {
  const [v, setV] = useState(value);
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4 overflow-auto" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { await onSave(v); } finally { setBusy(false); } }}
        className="bg-background border border-border max-w-2xl w-full p-6"
      >
        <h2 className="font-display text-xl mb-4">{v.id ? "Editar producto" : "Nuevo producto"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre" className="sm:col-span-2" value={v.nombre} onChange={(x) => setV({ ...v, nombre: x })} required />
          <Field label="SKU" value={v.sku} onChange={(x) => setV({ ...v, sku: x })} />
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Categoría</span>
            <select value={v.categoria} onChange={(e) => setV({ ...v, categoria: e.target.value })} className="w-full mt-1 border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="">Seleccionar categoría</option>
              {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </label>
          <Field label="Grupo" value={v.grupo} onChange={(x) => setV({ ...v, grupo: x })} />
          <Field label="Precio (ARS)" type="number" value={String(v.precio)} onChange={(x) => setV({ ...v, precio: Number(x) })} required />
          <Field label="Stock" type="number" value={String(v.stock)} onChange={(x) => setV({ ...v, stock: Number(x) })} required />
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Descripción</span>
            <textarea value={v.descripcion} onChange={(e) => setV({ ...v, descripcion: e.target.value })} rows={4} className="w-full mt-1 border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
        </div>
        <div className="flex gap-2 mt-6 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm">Cancelar</button>
          <button disabled={busy} type="submit" className="bg-primary text-primary-foreground px-5 py-2 text-sm font-medium">{busy ? "..." : "Guardar"}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, required, type, className }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <input type={type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full mt-1 border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
    </label>
  );
}
