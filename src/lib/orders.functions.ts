import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const itemSchema = z.object({
  id: z.number().int(),
  nombre: z.string().min(1).max(255),
  precio: z.number().nonnegative(),
  qty: z.number().int().positive().max(999),
  sku: z.string().max(80).nullable().optional(),
});

const createOrderSchema = z.object({
  items: z.array(itemSchema).min(1).max(100),
  email: z.string().email(),
  nombre: z.string().trim().min(1).max(120),
  telefono: z.string().trim().min(1).max(40),
  direccion: z.object({
    calle: z.string().min(1).max(120),
    numero: z.string().max(20).optional().nullable(),
    piso: z.string().max(20).optional().nullable(),
    ciudad: z.string().min(1).max(80),
    provincia: z.string().min(1).max(80),
    codigo_postal: z.string().min(1).max(20),
  }),
  notas: z.string().max(500).optional().nullable(),
});

export const createOrderAndPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => createOrderSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const total = data.items.reduce((a, b) => a + b.precio * b.qty, 0);

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .insert({
        user_id: userId,
        estado: "pendiente",
        total,
        email: data.email,
        nombre: data.nombre,
        telefono: data.telefono,
        direccion: data.direccion,
        notas: data.notas ?? null,
      })
      .select()
      .single();
    if (error || !pedido) throw new Error(error?.message ?? "No se pudo crear el pedido");

    const items = data.items.map((i) => ({
      pedido_id: pedido.id,
      producto_id: i.id,
      nombre: i.nombre,
      sku: i.sku ?? null,
      precio_unitario: i.precio,
      cantidad: i.qty,
      subtotal: i.precio * i.qty,
    }));
    const { error: itErr } = await supabase.from("pedido_items").insert(items);
    if (itErr) throw new Error(itErr.message);

    // Mercado Pago
    const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!MP_TOKEN) {
      return { pedidoId: pedido.id, initPoint: null, sandboxInitPoint: null, mpConfigured: false };
    }

    const origin = process.env.PUBLIC_BASE_URL ?? "";
    const prefBody = {
      items: data.items.map((i) => ({
        title: i.nombre.slice(0, 250),
        quantity: i.qty,
        currency_id: "ARS",
        unit_price: Number(i.precio),
      })),
      payer: { email: data.email, name: data.nombre },
      external_reference: pedido.id,
      back_urls: {
        success: `${origin}/cuenta?pedido=${pedido.id}`,
        failure: `${origin}/checkout?pedido=${pedido.id}`,
        pending: `${origin}/cuenta?pedido=${pedido.id}`,
      },
      auto_return: "approved",
      notification_url: `${origin}/api/public/mercadopago`,
    };

    const resp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${MP_TOKEN}` },
      body: JSON.stringify(prefBody),
    });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("MP preference error", t);
      return { pedidoId: pedido.id, initPoint: null, sandboxInitPoint: null, mpConfigured: true, error: "MP no respondió correctamente" };
    }
    const pref = await resp.json();
    await supabaseAdmin.from("pedidos").update({ mp_preference_id: pref.id }).eq("id", pedido.id);

    return {
      pedidoId: pedido.id,
      initPoint: pref.init_point as string,
      sandboxInitPoint: pref.sandbox_init_point as string,
      mpConfigured: true,
    };
  });
