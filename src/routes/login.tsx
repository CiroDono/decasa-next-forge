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

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("email not confirmed")) return "Tenés que confirmar tu email antes de ingresar. Revisá tu casilla (y la carpeta de Spam).";
  if (m.includes("invalid login credentials")) return "Email o contraseña incorrectos.";
  if (m.includes("user already registered")) return "Ya existe una cuenta con ese email. Iniciá sesión.";
  if (m.includes("email rate limit") || m.includes("rate limit")) return "Demasiados intentos. Esperá unos minutos antes de volver a probar.";
  if (m.includes("password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
  if (m.includes("unable to validate email") || m.includes("invalid email")) return "El email no es válido.";
  if (m.includes("signup is disabled")) return "El registro está deshabilitado temporalmente.";
  if (m.includes("network")) return "Error de red. Verificá tu conexión.";
  return msg;
}

function LoginPage() {
  const search = useSearch({ from: "/login" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">(search.mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNeedsConfirm(null);
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nombre },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setNeedsConfirm(email);
          toast.success("Cuenta creada. Te enviamos un email para confirmar tu cuenta antes de ingresar.");
          setMode("login");
        } else {
          toast.success("Bienvenido");
          navigate({ to: search.redirect });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bienvenido");
        navigate({ to: search.redirect });
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Error";
      if (/email.*not.*confirm/i.test(raw)) setNeedsConfirm(email);
      toast.error(translateAuthError(raw));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirm() {
    const target = needsConfirm || email;
    if (!target) return toast.error("Ingresá tu email primero");
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: target,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) toast.error(translateAuthError(error.message));
    else toast.success("Te reenviamos el email de confirmación");
  }

  async function handleReset() {
    if (!email) return toast.error("Ingresá tu email primero");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(translateAuthError(error.message));
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

        {needsConfirm && (
          <div className="mb-6 border border-border bg-muted/40 p-3 text-sm">
            <p className="mb-2">
              Aún no confirmaste el email <strong>{needsConfirm}</strong>. Revisá tu bandeja de entrada y la carpeta de Spam.
            </p>
            <button
              type="button"
              onClick={handleResendConfirm}
              disabled={loading}
              className="text-primary hover:underline disabled:opacity-50"
            >
              Reenviar email de confirmación
            </button>
          </div>
        )}

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
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setNeedsConfirm(null); }}
            className={mode === "login" ? "border border-black px-3 py-1 hover:bg-black hover:text-white transition" : "text-primary hover:underline"}
          >
            {mode === "login" ? "Crear cuenta nueva" : "Ya tengo cuenta"}
          </button>
          {mode === "login" && (
            <button type="button" onClick={handleReset} className="border border-black px-3 py-1 hover:bg-black hover:text-white transition">
              Olvidé mi contraseña
            </button>
          )}
        </div>
        <Link to="/" className="inline-block text-center mt-8 text-xs border border-black px-3 py-1 hover:bg-black hover:text-white transition">
          ← Volver al inicio
        </Link>
      </div>
    </Layout>
  );
}
