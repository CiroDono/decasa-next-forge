import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin requerido");
}

export const adminListPedidos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("pedidos")
      .select("id, estado, total, email, nombre, telefono, direccion, created_at, mp_payment_id, pedido_items(id, nombre, cantidad, subtotal)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdatePedidoEstado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    estado: z.enum(["pendiente", "pagado", "enviado", "entregado", "cancelado"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("pedidos").update({ estado: data.estado }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListProductos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    q: z.string().max(100).optional().nullable(),
    page: z.number().int().min(1).max(500).optional(),
    cat: z.string().max(100).optional().nullable(),
    grupo: z.string().max(100).optional().nullable(),
    activo: z.enum(["all", "yes", "no"]).optional(),
  }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const page = data.page ?? 1;
    const pageSize = 30;
    let q = context.supabase.from("productos").select("*", { count: "exact" }).order("id", { ascending: false });
    if (data.q) q = q.ilike("nombre", `%${data.q}%`);
    if (data.cat) q = q.eq("categoria", data.cat);
    if (data.grupo) q = q.eq("grupo", data.grupo);
    if (data.activo === "yes") q = q.eq("activo", true);
    if (data.activo === "no") q = q.eq("activo", false);
    q = q.range((page - 1) * pageSize, page * pageSize - 1);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], count: count ?? 0, page, pageSize };
  });

const productoSchema = z.object({
  id: z.number().int().optional(),
  nombre: z.string().trim().min(1).max(255),
  descripcion: z.string().max(5000).optional().nullable(),
  categoria: z.string().max(100).optional().nullable(),
  grupo: z.string().max(100).optional().nullable(),
  sku: z.string().max(80).optional().nullable(),
  precio: z.number().nonnegative(),
  stock: z.number().int().min(0),
  image_url: z.string().max(500).optional().nullable(),
  image_webp: z.string().max(500).optional().nullable(),
  activo: z.boolean().optional(),
  precio_oferta: z.number().nonnegative().nullable().optional(),
  oferta_hasta: z.string().nullable().optional(),
});

export const adminUpsertProducto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => productoSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { id, ...rest } = data;
    if (id) {
      const { error } = await context.supabase.from("productos").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    } else {
      const { data: inserted, error } = await context.supabase.from("productos").insert(rest).select("id").single();
      if (error) throw new Error(error.message);
      return { ok: true, id: inserted?.id as number };
    }
  });

export const adminDeleteProducto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("productos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// === BULK ACTIONS ===

const bulkSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set_categoria"), ids: z.array(z.number().int()).min(1).max(500), categoria: z.string().max(100).nullable() }),
  z.object({ action: z.literal("set_grupo"), ids: z.array(z.number().int()).min(1).max(500), grupo: z.string().max(100).nullable() }),
  z.object({ action: z.literal("set_activo"), ids: z.array(z.number().int()).min(1).max(500), activo: z.boolean() }),
  z.object({ action: z.literal("adjust_precio_pct"), ids: z.array(z.number().int()).min(1).max(500), pct: z.number().min(-90).max(500) }),
  z.object({ action: z.literal("set_stock"), ids: z.array(z.number().int()).min(1).max(500), stock: z.number().int().min(0).max(1_000_000) }),
  z.object({
    action: z.literal("set_oferta"),
    ids: z.array(z.number().int()).min(1).max(500),
    precio_oferta: z.number().nonnegative().nullable(),
    oferta_hasta: z.string().nullable(),
  }),
  z.object({ action: z.literal("delete"), ids: z.array(z.number().int()).min(1).max(500) }),
]);

export const adminBulkProductos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => bulkSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const sb = context.supabase;

    switch (data.action) {
      case "set_categoria": {
        const { error } = await sb.from("productos").update({ categoria: data.categoria }).in("id", data.ids);
        if (error) throw new Error(error.message);
        return { ok: true, updated: data.ids.length };
      }
      case "set_grupo": {
        const { error } = await sb.from("productos").update({ grupo: data.grupo }).in("id", data.ids);
        if (error) throw new Error(error.message);
        return { ok: true, updated: data.ids.length };
      }
      case "set_activo": {
        const { error } = await sb.from("productos").update({ activo: data.activo }).in("id", data.ids);
        if (error) throw new Error(error.message);
        return { ok: true, updated: data.ids.length };
      }
      case "set_stock": {
        const { error } = await sb.from("productos").update({ stock: data.stock }).in("id", data.ids);
        if (error) throw new Error(error.message);
        return { ok: true, updated: data.ids.length };
      }
      case "set_oferta": {
        if (data.precio_oferta != null && data.precio_oferta < 0) {
          throw new Error("Precio de oferta inválido");
        }
        const { error } = await sb.from("productos").update({
          precio_oferta: data.precio_oferta,
          oferta_hasta: data.oferta_hasta,
        }).in("id", data.ids);
        if (error) throw new Error(error.message);
        return { ok: true, updated: data.ids.length };
      }
      case "adjust_precio_pct": {
        // Read current prices, compute new, update one by one.
        const { data: rows, error: e1 } = await sb.from("productos").select("id, precio").in("id", data.ids);
        if (e1) throw new Error(e1.message);
        const factor = 1 + data.pct / 100;
        let count = 0;
        for (const r of rows ?? []) {
          const current = Number(r.precio ?? 0);
          if (current <= 0) continue;
          const next = Math.max(0, Math.round(current * factor * 100) / 100);
          const { error } = await sb.from("productos").update({ precio: next }).eq("id", r.id);
          if (error) throw new Error(error.message);
          count++;
        }
        return { ok: true, updated: count };
      }
      case "delete": {
        const { error } = await sb.from("productos").delete().in("id", data.ids);
        if (error) throw new Error(error.message);
        return { ok: true, updated: data.ids.length };
      }
    }
  });

// === PRODUCT IMAGES (galería) ===

export const adminListProductImages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ producto_id: z.number().int() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("product_images")
      .select("*")
      .eq("producto_id", data.producto_id)
      .order("orden", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminAddProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    producto_id: z.number().int(),
    url: z.string().max(500).nullable().optional(),
    url_webp: z.string().max(500).nullable().optional(),
    alt: z.string().max(255).nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data: max } = await context.supabase
      .from("product_images")
      .select("orden")
      .eq("producto_id", data.producto_id)
      .order("orden", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrden = (max?.orden ?? -1) + 1;
    const { data: inserted, error } = await context.supabase
      .from("product_images")
      .insert({
        producto_id: data.producto_id,
        url: data.url ?? null,
        url_webp: data.url_webp ?? null,
        alt: data.alt ?? null,
        orden: nextOrden,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return inserted;
  });

export const adminReorderProductImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    producto_id: z.number().int(),
    items: z.array(z.object({ id: z.string().uuid(), orden: z.number().int().min(0).max(1000) })).max(100),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    for (const it of data.items) {
      const { error } = await context.supabase
        .from("product_images")
        .update({ orden: it.orden })
        .eq("id", it.id)
        .eq("producto_id", data.producto_id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

function extractStorageKey(url: string | null | undefined, bucket = "product-images"): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const i = url.indexOf(marker);
  if (i < 0) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

export const adminDeleteProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    // Leer la fila para conocer los archivos del bucket asociados.
    const { data: row } = await context.supabase
      .from("product_images")
      .select("url, url_webp")
      .eq("id", data.id)
      .maybeSingle();
    const keys = [extractStorageKey(row?.url), extractStorageKey(row?.url_webp)].filter(Boolean) as string[];
    if (keys.length) {
      // Best-effort: si falla la limpieza del storage, igual borramos el registro.
      await context.supabase.storage.from("product-images").remove(keys).catch(() => {});
    }
    const { error } = await context.supabase.from("product_images").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListCategorias = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("productos")
      .select("categoria")
      .not("categoria", "is", null)
      .order("categoria");
    if (error) throw new Error(error.message);
    const categorias = [...new Set(data?.map(p => p.categoria).filter(Boolean))].sort();
    return categorias;
  });

export const adminListGrupos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("productos")
      .select("grupo")
      .not("grupo", "is", null)
      .order("grupo");
    if (error) throw new Error(error.message);
    return [...new Set(data?.map(p => p.grupo).filter(Boolean))].sort();
  });

export const adminListUsuarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data: profiles, error } = await context.supabase
      .from("profiles").select("id, nombre, telefono, dni, created_at")
      .order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    const ids = (profiles ?? []).map((p) => p.id);
    const { data: roles } = await context.supabase
      .from("user_roles").select("user_id, role").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((r) => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    });
    return (profiles ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? ["user"] }));
  });

export const adminToggleAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    user_id: z.string().uuid(),
    make_admin: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    if (data.make_admin) {
      const { error } = await context.supabase.from("user_roles").insert({ user_id: data.user_id, role: "admin" });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("user_roles").delete().eq("user_id", data.user_id).eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const [{ data: pedidos }, { count: prodCount }, { data: lowStock }] = await Promise.all([
      context.supabase.from("pedidos").select("id, total, estado, created_at").gte("created_at", since.toISOString()),
      context.supabase.from("productos").select("id", { count: "exact", head: true }),
      context.supabase.from("productos").select("id, nombre, stock").lte("stock", 5).gt("stock", 0).limit(20),
    ]);
    const ventasMes = (pedidos ?? []).filter((p) => p.estado !== "cancelado").reduce((a, b) => a + Number(b.total), 0);
    const pedidosMes = (pedidos ?? []).length;
    const pendientes = (pedidos ?? []).filter((p) => p.estado === "pendiente").length;
    return {
      ventasMes, pedidosMes, pendientes,
      productosTotal: prodCount ?? 0,
      lowStock: lowStock ?? [],
    };
  });
