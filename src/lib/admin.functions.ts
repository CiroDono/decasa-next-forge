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
  }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const page = data.page ?? 1;
    const pageSize = 30;
    let q = context.supabase.from("productos").select("*", { count: "exact" }).order("id", { ascending: false });
    if (data.q) q = q.ilike("nombre", `%${data.q}%`);
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
    } else {
      const { error } = await context.supabase.from("productos").insert(rest);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
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
