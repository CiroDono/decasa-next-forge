import { supabase } from "@/integrations/supabase/client";
import { normalizeCategoryName, uniqueSortedCategories } from "@/lib/categories";

export type Producto = {
  id: number;
  nombre: string | null;
  descripcion: string | null;
  categoria: string | null;
  grupo: string | null;
  sku: string | null;
  precio: number | null;
  stock: number | null;
  image_url?: string | null;
  image_webp?: string | null;
  activo?: boolean;
  precio_oferta?: number | null;
  oferta_hasta?: string | null;
};

export type ProductImageRow = {
  id: string;
  producto_id: number;
  url: string | null;
  url_webp: string | null;
  alt: string | null;
  orden: number;
};

export type SortKey = "relevance" | "price-asc" | "price-desc" | "name-asc";

export function getPrecioEfectivo(p: Pick<Producto, "precio" | "precio_oferta" | "oferta_hasta">): number {
  const base = Number(p.precio ?? 0);
  if (
    p.precio_oferta != null &&
    Number(p.precio_oferta) > 0 &&
    (!p.oferta_hasta || new Date(p.oferta_hasta) > new Date())
  ) {
    return Number(p.precio_oferta);
  }
  return base;
}

export function tieneOferta(p: Pick<Producto, "precio" | "precio_oferta" | "oferta_hasta">): boolean {
  return getPrecioEfectivo(p) < Number(p.precio ?? 0);
}

export async function fetchProductos(opts: {
  q?: string;
  cat?: string;
  grupo?: string;
  min?: number;
  max?: number;
  sort?: SortKey;
  limit?: number;
  offset?: number;
}): Promise<{ items: Producto[]; count: number }> {
  let query = supabase.from("productos").select("*", { count: "exact" });

  const normalizedCat = normalizeCategoryName(opts.cat);
  if (normalizedCat) query = query.eq("categoria", normalizedCat);
  if (opts.grupo) query = query.eq("grupo", opts.grupo);
  if (typeof opts.min === "number") query = query.gte("precio", opts.min);
  if (typeof opts.max === "number") query = query.lte("precio", opts.max);
  if (opts.q) {
    const safe = opts.q.replace(/[%,()]/g, " ").trim();
    if (safe) {
      query = query.or(
        `nombre.ilike.%${safe}%,categoria.ilike.%${safe}%,grupo.ilike.%${safe}%,descripcion.ilike.%${safe}%,sku.ilike.%${safe}%`,
      );
    }
  }

  switch (opts.sort) {
    case "price-asc":
      query = query.order("precio", { ascending: true, nullsFirst: false });
      break;
    case "price-desc":
      query = query.order("precio", { ascending: false, nullsFirst: false });
      break;
    case "name-asc":
      query = query.order("nombre", { ascending: true });
      break;
    default:
      query = query.order("id", { ascending: true });
  }

  const limit = opts.limit ?? 24;
  const offset = opts.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;
  return { items: (data ?? []) as Producto[], count: count ?? 0 };
}

export async function fetchProducto(id: number): Promise<Producto | null> {
  const { data, error } = await supabase.from("productos").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Producto | null;
}

export async function fetchProductoImagenes(productoId: number): Promise<ProductImageRow[]> {
  const { data, error } = await (supabase as any)
    .from("product_images")
    .select("*")
    .eq("producto_id", productoId)
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProductImageRow[];
}

export async function fetchCategorias(): Promise<string[]> {
  const { data, error } = await (supabase as any)
    .from("categorias")
    .select("nombre")
    .eq("activo", true)
    .order("orden", { ascending: true, nullsFirst: false })
    .order("nombre", { ascending: true });

  if (!error) return uniqueSortedCategories((data ?? []).map((c: { nombre: string | null }) => c.nombre));

  const fallback = await supabase.from("productos").select("categoria");
  if (fallback.error) throw fallback.error;
  return uniqueSortedCategories((fallback.data ?? []).map((r: { categoria: string | null }) => r.categoria));
}

export async function fetchGrupos(): Promise<string[]> {
  const { data, error } = await supabase.from("productos").select("grupo");
  if (error) throw error;
  const set = new Set<string>();
  (data ?? []).forEach((r: { grupo: string | null }) => {
    if (r.grupo) set.add(r.grupo);
  });
  return Array.from(set).sort();
}

export async function fetchPriceRange(): Promise<{ min: number; max: number }> {
  const [{ data: lo }, { data: hi }] = await Promise.all([
    supabase.from("productos").select("precio").order("precio", { ascending: true, nullsFirst: false }).limit(1).maybeSingle(),
    supabase.from("productos").select("precio").order("precio", { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
  ]);
  return {
    min: Math.floor(Number(lo?.precio ?? 0)),
    max: Math.ceil(Number(hi?.precio ?? 0)),
  };
}
