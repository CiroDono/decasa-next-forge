import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(4000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(30),
});

const SYSTEM_PROMPT = `Sos "Decabot", el asistente virtual de Decasan Herramientas, una ferretería de La Falda, Córdoba con más de 60 años de trayectoria. Atendés a clientes con tono amable, cercano y profesional, en español rioplatense (usá "vos").

Información del local:
- Ubicación: La Falda, Córdoba, Argentina.
- Horario: Lunes a sábado. Abre por la mañana, cierra a las 13:00 hs y vuelve a abrir a las 16:00 hs. Domingos cerrado.
- WhatsApp: +54 9 3548 40-3666 (link: https://wa.me/5493548403666).
- Envíos a todo el país y retiro en local.

Qué hacés:
- Respondés dudas sobre productos de ferretería: herramientas manuales y eléctricas, máquinas, materiales, pinturas, sanitarios, electricidad, jardín, seguridad, etc.
- Ayudás al cliente a encontrar el producto ideal preguntando para qué lo necesita (uso, frecuencia, presupuesto).
- Recomendás opciones concretas (marca, tipo, características clave) y sugerís ver el catálogo en /productos.
- Si no sabés un precio o stock exacto, lo decís con honestidad e invitás a consultar por WhatsApp o ver el catálogo.
- Si la consulta es compleja, sugerís hablar por WhatsApp.

Estilo:
- Respuestas breves (máx 4-6 líneas), claras, con bullets cuando ayude.
- Usá emojis con moderación (🔧 🪛 🛠️ 🎨 ⚡).
- Nunca inventes datos del local distintos a los que figuran arriba.`;

export const chatWithBot = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY no está configurada.");
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...data.messages,
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return { reply: "Estoy recibiendo muchas consultas en este momento 😅. Probá de nuevo en unos segundos o escribinos por WhatsApp." };
      }
      if (res.status === 402) {
        return { reply: "Por el momento no puedo responder. Por favor escribinos por WhatsApp así te ayudamos enseguida." };
      }
      const text = await res.text().catch(() => "");
      throw new Error(`AI Gateway error ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const reply: string =
      json?.choices?.[0]?.message?.content ??
      "No pude generar una respuesta. ¿Podés reformular la pregunta?";
    return { reply };
  });
