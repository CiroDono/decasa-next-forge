import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({ component: ResetPassword });

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Contraseña actualizada");
      navigate({ to: "/cuenta" });
    }
  }

  return (
    <Layout>
      <div className="container-x max-w-md py-16">
        <h1 className="font-display text-3xl mb-6">Nueva contraseña</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Nueva contraseña"
            className="w-full border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 font-display tracking-wide hover:bg-primary/90"
          >
            Guardar
          </button>
        </form>
      </div>
    </Layout>
  );
}
