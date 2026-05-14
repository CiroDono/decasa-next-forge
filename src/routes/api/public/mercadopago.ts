import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Mercado Pago IPN/Webhook: https://www.mercadopago.com.ar/developers
// MP envía POST con { type, data: { id } } o query params equivalentes.
export const Route = createFileRoute("/api/public/mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!MP_TOKEN) return new Response("MP no configurado", { status: 200 });

        let payload: any = {};
        try { payload = await request.json(); } catch { /* MP a veces manda querystring */ }
        const url = new URL(request.url);
        const type = payload.type ?? url.searchParams.get("type");
        const dataId = payload?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");

        if (type !== "payment" || !dataId) {
          return new Response("ignored", { status: 200 });
        }

        // Consultar el pago a MP
        const r = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
          headers: { Authorization: `Bearer ${MP_TOKEN}` },
        });
        if (!r.ok) {
          console.error("MP fetch payment failed", await r.text());
          return new Response("error", { status: 200 });
        }
        const pay = await r.json();
        const externalRef = pay.external_reference;
        const status = pay.status; // approved, pending, rejected, refunded, etc.
        if (!externalRef) return new Response("no ref", { status: 200 });

        const estado =
          status === "approved" ? "pagado" :
          status === "pending" || status === "in_process" ? "pendiente" :
          status === "rejected" || status === "cancelled" ? "cancelado" :
          status === "refunded" ? "cancelado" : "pendiente";

        await supabaseAdmin
          .from("pedidos")
          .update({ estado, mp_payment_id: String(dataId) })
          .eq("id", externalRef);

        return new Response("ok", { status: 200 });
      },
      GET: async () => new Response("MP webhook ready", { status: 200 }),
    },
  },
});
