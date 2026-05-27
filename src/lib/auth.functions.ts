import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const gmailSchema = z.string().trim().email().regex(/^[a-zA-Z0-9._%+-]+@gmail\.com$/, "Solo se aceptan cuentas Gmail");

export function canonicalGmail(email: string): string {
  const [local] = email.trim().toLowerCase().split("@");
  const cleanLocal = local.split("+")[0].replace(/\./g, "");
  return `${cleanLocal}@gmail.com`;
}

export const checkGmailAvailability = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: gmailSchema }).parse(d))
  .handler(async ({ data }) => {
    const canonical = canonicalGmail(data.email);
    let page = 1;

    while (page <= 20) {
      const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });

      if (error) {
        console.error("[auth] gmail availability check failed", error.message);
        throw new Error("No pudimos validar el email. Intentá nuevamente.");
      }

      const exists = users.users.some((user) => user.email && canonicalGmail(user.email) === canonical);
      if (exists) return { available: false, canonical };
      if (users.users.length < 1000) break;
      page += 1;
    }

    return { available: true, canonical };
  });
