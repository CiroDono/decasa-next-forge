import { supabase } from "@/integrations/supabase/client";

export type Producto = {
  id: number;
  nombre: string | null;
  descripcion: string | null;
  categoria: string | null;
  grupo: string | null;
  sku: string | null;
  precio: number | null;
  stock: number | null;
};

export async function fetchProductos(opts: {
  q?: string;
  cat?: string;
  grupo?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: Producto[]; count: number }> {
  let query = supabase
    .from("productos")
    .select("*", { count: "exact" })
    .order("id", { ascending: true });

  if (opts.cat) query = query.eq("categoria", opts.cat);
  if (opts.grupo) query = query.eq("grupo", opts.grupo);
  if (opts.q) query = query.ilike("nombre", `%${opts.q}%`);

  const limit = opts.limit ?? 24;
  const offset = opts.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;
  return { items: (data ?? []) as Producto[], count: count ?? 0 };
}

export async function fetchProducto(id: number): Promise<Producto | null> {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Producto | null;
}

export async function fetchCategorias(): Promise<string[]> {
  const { data, error } = await supabase.from("productos").select("categoria");
  if (error) throw error;
  const set = new Set<string>();
  (data ?? []).forEach((r: { categoria: string | null }) => {
    if (r.categoria) set.add(r.categoria);
  });
  return Array.from(set).sort();
}
