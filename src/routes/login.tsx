import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/cuenta",
    mode: s.mode === "register" ? "register" : "login",
  }),
  component: LoginPage,
});

// ---------- Validación ----------
const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const dniRegex = /^\d{7,9}$/; // Argentina: 7-9 dígitos
const telRegex = /^\+?\d{8,15}$/;
const passRegex = {
  len: (p: string) => p.length >= 8,
  upper: (p: string) => /[A-Z]/.test(p),
  lower: (p: string) => /[a-z]/.test(p),
  digit: (p: string) => /\d/.test(p),
};

const registerSchema = z.object({
  nombre: z.string().trim().min(2, "Nombre muy corto").max(80),
  email: z.string().trim().toLowerCase().regex(gmailRegex, "Debe ser un email @gmail.com válido"),
  dni: z.string().trim().regex(dniRegex, "DNI inválido (7 a 9 dígitos, sólo números)"),
  telefono: z.string().trim().regex(telRegex, "Teléfono inválido (8 a 15 dígitos, opcional +)"),
  password: z.string()
    .min(8, "Mínimo 8 caracteres")
    .refine(passRegex.upper, "Debe incluir una mayúscula")
    .refine(passRegex.lower, "Debe incluir una minúscula")
    .refine(passRegex.digit, "Debe incluir un número"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

function LoginPage() {
  const search = useSearch({ from: "/login" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">(search.mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ nombre: true, email: true, dni: true, telefono: true, password: true });
    if (!canSubmit) {
      toast.error("Revisá los datos del formulario");
      return;
    }
    setLoading(true);
    try {
      if (mode === "register") {
        const parsed = registerSchema.parse({ nombre, email, dni, telefono, password });
        const { error } = await supabase.auth.signUp({
          email: parsed.email,
          password: parsed.password,
          options: {
            data: { nombre: parsed.nombre, dni: parsed.dni, telefono: parsed.telefono },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Revisá tu email para confirmar.");
        setMode("login");
        setPassword("");
      } else {
        const parsed = loginSchema.parse({ email, password });
        const { error } = await supabase.auth.signInWithPassword({ email: parsed.email, password: parsed.password });
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
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Te enviamos un email para restablecer la contraseña");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar el email");
    } finally {
      setResetLoading(false);
    }
  }

  function show(field: string) {
    return touched[field] && fieldErrors[field];
  }

  const inputCls = (field: string) =>
    `w-full mt-1 border bg-background px-3 py-2.5 outline-none focus:border-primary ${
      show(field) ? "border-destructive" : "border-border"
    }`;

  return (
    <Layout>
      <div className="container-x max-w-md py-16">
        <h1 className="font-display text-3xl mb-2">{mode === "login" ? "Ingresar" : "Crear cuenta"}</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {mode === "login"
            ? "Accedé para ver tus pedidos y comprar."
            : "Registrate con tu Gmail. Todos los campos son obligatorios."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {mode === "register" && (
            <div>
              <label className="text-sm font-medium">Nombre completo</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value.slice(0, 80))}
                onBlur={() => setTouched((t) => ({ ...t, nombre: true }))}
                autoComplete="name"
                required
                className={inputCls("nombre")}
              />
              {show("nombre") && <p className="text-xs text-destructive mt-1">{fieldErrors.nombre}</p>}
            </div>
          )}

          <div>
            <label className="text-sm font-medium">
              Email {mode === "register" && <span className="text-muted-foreground text-xs">(@gmail.com)</span>}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              autoComplete="email"
              inputMode="email"
              required
              className={inputCls("email")}
              placeholder={mode === "register" ? "tunombre@gmail.com" : "tu@email.com"}
            />
            {show("email") && <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>}
          </div>

          {mode === "register" && (
            <>
              <div>
                <label className="text-sm font-medium">DNI</label>
                <input
                  value={dni}
                  onChange={(e) => onDniChange(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, dni: true }))}
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  className={inputCls("dni")}
                  placeholder="12345678"
                />
                {show("dni") && <p className="text-xs text-destructive mt-1">{fieldErrors.dni}</p>}
              </div>

              <div>
                <label className="text-sm font-medium">Teléfono</label>
                <input
                  value={telefono}
                  onChange={(e) => onTelChange(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, telefono: true }))}
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  className={inputCls("telefono")}
                  placeholder="+5491122334455"
                />
                {show("telefono") && <p className="text-xs text-destructive mt-1">{fieldErrors.telefono}</p>}
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium">Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value.slice(0, 200))}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                required
                minLength={mode === "register" ? 8 : 1}
                className={inputCls("password") + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary"
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {mode === "register" && (
              <ul className="mt-2 space-y-0.5 text-xs">
                <ReqRow ok={passChecks.len}>Mínimo 8 caracteres</ReqRow>
                <ReqRow ok={passChecks.upper}>1 mayúscula</ReqRow>
                <ReqRow ok={passChecks.lower}>1 minúscula</ReqRow>
                <ReqRow ok={passChecks.digit}>1 número</ReqRow>
              </ul>
            )}
            {mode === "login" && show("password") && <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-primary text-primary-foreground py-3 font-display tracking-wide hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "..." : mode === "login" ? "Ingresar" : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setTouched({}); }}
            className="text-primary hover:underline"
          >
            {mode === "login" ? "Crear cuenta nueva" : "Ya tengo cuenta"}
          </button>
          {mode === "login" && (
            <button 
              type="button" 
              onClick={handleReset} 
              disabled={resetLoading || !email}
              className="text-muted-foreground hover:text-primary disabled:opacity-50"
            >
              {resetLoading ? "Enviando..." : "Olvidé mi contraseña"}
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

function ReqRow({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? "text-success" : "text-muted-foreground"}`}>
      {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
      {children}
    </li>
  );
}
