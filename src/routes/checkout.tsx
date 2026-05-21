import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CreditCard, Truck, MessageCircle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import type { ShippingOption } from "@/lib/shipping.functions";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/auth";
import { formatARS } from "@/lib/format";
import { getProfile } from "@/lib/profile.functions";
import { createOrderAndPreference } from "@/lib/orders.functions";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const clear = useCart((s) => s.clear);
  const profileFn = useServerFn(getProfile);
  const orderFn = useServerFn(createOrderAndPreference);

  const profile = useQuery({ queryKey: ["profile"], queryFn: () => profileFn(), enabled: !!user });

  const [form, setForm] = useState({
    email: "", nombre: "", telefono: "",
    calle: "", numero: "", piso: "", ciudad: "", provincia: "", codigo_postal: "",
    notas: "",
  });
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { redirect: "/checkout", mode: "login" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile.data) {
      const p = profile.data.profile;
      const d = profile.data.direcciones[0];
      setForm((f) => ({
        ...f,
        email: user?.email ?? f.email,
        nombre: f.nombre || p?.nombre || "",
        telefono: f.telefono || p?.telefono || "",
        calle: f.calle || d?.calle || "",
        numero: f.numero || d?.numero || "",
        piso: f.piso || d?.piso || "",
        ciudad: f.ciudad || d?.ciudad || "",
        provincia: f.provincia || d?.provincia || "",
        codigo_postal: f.codigo_postal || d?.codigo_postal || "",
      }));
    }
  }, [profile.data, user]);

  if (loading || !user) return <Layout><div className="container-x py-20 text-center text-muted-foreground">Cargando...</div></Layout>;

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container-x py-20 max-w-md text-center">
          <h1 className="font-display text-3xl">Tu carrito está vacío</h1>
          <Link to="/productos" className="inline-block mt-6 bg-primary text-primary-foreground px-5 py-2.5 font-display tracking-wide hover:bg-primary/90">
            Ver productos
          </Link>
        </div>
      </Layout>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedShipping) {
      toast.error("Selecciona una opcion de envio");
      return;
    }
    setBusy(true);
    try {
      const res = await orderFn({
        data: {
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
          email: form.email,
          nombre: form.nombre,
          telefono: form.telefono,
          direccion: {
            calle: form.calle, numero: form.numero, piso: form.piso,
            ciudad: form.ciudad, provincia: form.provincia, codigo_postal: form.codigo_postal,
          },
          envio: {
            codigo_servicio: selectedShipping.codigo_servicio,
          },
          notas: form.notas || null,
        },
      });
      clear();
      if (res.initPoint) {
        window.location.href = res.initPoint;
      } else {
        toast.success("Pedido creado. Te contactamos para coordinar el pago.");
        navigate({ to: "/cuenta" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear pedido");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <div className="container-x py-10 max-w-5xl">
        <h1 className="font-display text-3xl mb-8">Finalizar compra</h1>

        <form onSubmit={submit} className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-6">
            <Section title="Datos de contacto">
              <Grid>
                <Field label="Nombre completo" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} required />
                <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                <Field label="Teléfono" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} required />
              </Grid>
            </Section>

            <Section title="Dirección de envío">
              <Grid>
                <Field label="Calle" value={form.calle} onChange={(v) => setForm({ ...form, calle: v })} required />
                <Field label="Número" value={form.numero} onChange={(v) => setForm({ ...form, numero: v })} />
                <Field label="Piso/Depto" value={form.piso} onChange={(v) => setForm({ ...form, piso: v })} />
                <Field label="Código postal" value={form.codigo_postal} onChange={(v) => setForm({ ...form, codigo_postal: v })} required />
                <Field label="Ciudad" value={form.ciudad} onChange={(v) => setForm({ ...form, ciudad: v })} required />
                <Field label="Provincia" value={form.provincia} onChange={(v) => setForm({ ...form, provincia: v })} required />
              </Grid>
              {form.codigo_postal && (
                <div className="mt-4 pt-4 border-t border-border">
                  <ShippingCalculator
                    codigoPostal={form.codigo_postal}
                    onShippingSelect={setSelectedShipping}
                    selectedShipping={selectedShipping?.codigo_servicio}
                  />
                </div>
              )}
            </Section>

            <Section title="Notas (opcional)">
              <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={3} className="w-full border border-border bg-background px-3 py-2 outline-none focus:border-primary" placeholder="Aclaraciones para la entrega..." />
            </Section>
          </div>

          <aside className="lg:sticky lg:top-24 self-start space-y-4 border border-border p-5 bg-surface-elevated">
            <h2 className="font-display text-lg">Resumen</h2>
            <ul className="space-y-2 text-sm border-b border-border pb-3">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span className="line-clamp-1">{i.qty}× {i.nombre}</span>
                  <span className="shrink-0">{formatARS(i.precio * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatARS(total)}</span></div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1"><Truck className="size-3" /> Envío</span>
              <span>{selectedShipping ? formatARS(selectedShipping.precio) : "A coordinar"}</span>
            </div>
            <div className="flex justify-between font-display text-xl pt-3 border-t border-border">
              <span>Total final</span>
              <span className="text-right text-base leading-tight">
                Validado al pagar
              </span>
            </div>

            <button disabled={busy || !selectedShipping} className="w-full bg-primary text-primary-foreground py-3 font-display tracking-wide hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
              <CreditCard className="size-4" /> {busy ? "Procesando..." : "Pagar con Mercado Pago"}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              El servidor valida precios, envio y total antes de redirigirte a Mercado Pago.
            </p>
            <a href="https://wa.me/5493548403666" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary text-center flex items-center justify-center gap-1">
              <MessageCircle className="size-3" /> Pagar por transferencia / consultar
            </a>
          </aside>
        </form>
      </div>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-sm tracking-wide uppercase text-muted-foreground mb-3">{title}</h2>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-3">{children}</div>;
}
function Field({ label, value, onChange, required, type }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <input type={type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full mt-1 border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
    </label>
  );
}
