import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/cuenta",
    mode: s.mode === "register" ? "register" : "login",
  }),
  component: LoginPage,
});

function LoginPage() {
  const search = useSearch({ from: "/login" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">(search.mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nombre },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Revisá tu email para confirmar.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bienvenido");
        navigate({ to: search.redirect });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!email) return toast.error("Ingresá tu email primero");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Te enviamos un email para restablecer la contraseña");
  }

  return (
    <Layout>
      <div className="container-x max-w-md py-16">
        <h1 className="font-display text-3xl mb-2">{mode === "login" ? "Ingresar" : "Crear cuenta"}</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {mode === "login"
            ? "Accedé para ver tus pedidos y comprar."
            : "Registrate para comprar y recibir tu historial."}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full mt-1 border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full mt-1 border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 font-display tracking-wide hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "..." : mode === "login" ? "Ingresar" : "Crear cuenta"}
          </button>
        </form>
        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className={mode === "login" ? "border border-black px-3 py-1 hover:bg-black hover:text-white transition" : "text-primary hover:underline"}
          >
            {mode === "login" ? "Crear cuenta nueva" : "Ya tengo cuenta"}
          </button>
          {mode === "login" && (
            <button type="button" onClick={handleReset} className="text-muted-foreground hover:text-primary">
              Olvidé mi contraseña
            </button>
          )}
        </div>
        <Link to="/" className="block text-center mt-8 text-xs text-muted-foreground hover:text-primary">
          ← Volver al inicio
        </Link>
      </div>
    </Layout>
  );
}
