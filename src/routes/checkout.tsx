import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
<<<<<<< HEAD
import { BadgeCheck, Banknote, CreditCard, MessageCircle, Store, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
=======
import { Banknote, CreditCard, Landmark, MessageCircle, ShieldCheck, Truck } from "lucide-react";
>>>>>>> e708b8bda8ce374b78fcf230bc919a09957cd739
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import { useSession } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { formatARS } from "@/lib/format";
import { createOrderAndPreference } from "@/lib/orders.functions";
import { getProfile } from "@/lib/profile.functions";
import { LOCAL_PICKUP_CODE, SHIPPING_PROVINCES } from "@/lib/shipping.functions";
import type { ShippingOption } from "@/lib/shipping.functions";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

<<<<<<< HEAD
type PaymentMethod = "transferencia" | "tarjeta" | "efectivo";
=======
type PaymentMethod = "transferencia_mp" | "tarjeta" | "efectivo";
>>>>>>> e708b8bda8ce374b78fcf230bc919a09957cd739

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
    email: "",
    nombre: "",
    telefono: "",
    calle: "",
    numero: "",
    piso: "",
    ciudad: "",
    provincia: "",
    codigo_postal: "",
    notas: "",
  });
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
<<<<<<< HEAD
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("tarjeta");
=======
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("transferencia_mp");
>>>>>>> e708b8bda8ce374b78fcf230bc919a09957cd739
  const [busy, setBusy] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const isLocalPickup = selectedShipping?.codigo_servicio === LOCAL_PICKUP_CODE;
  const shippingTotal = selectedShipping?.precio ?? 0;
  const finalTotal = total + shippingTotal;

  function setProvincia(provincia: string) {
    setForm((current) => ({ ...current, provincia }));
    setSelectedShipping(null);
  }

  function setShipping(option: ShippingOption | null) {
    setSelectedShipping(option);
    if (option?.codigo_servicio !== LOCAL_PICKUP_CODE && paymentMethod === "efectivo") {
      setPaymentMethod("transferencia_mp");
    }
  }

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { redirect: "/checkout", mode: "login" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        provincia: f.provincia || findShippingProvince(d?.provincia) || "",
        codigo_postal: f.codigo_postal || d?.codigo_postal || "",
      }));
    }
  }, [profile.data, user]);

  useEffect(() => {
    if (!isLocalPickup && paymentMethod === "efectivo") {
      setPaymentMethod("tarjeta");
    }
  }, [isLocalPickup, paymentMethod]);

  if (!isMounted || loading || !user) {
    return (
      <Layout>
        <div className="container-x py-20 text-center text-muted-foreground">Cargando...</div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container-x py-20 max-w-md text-center">
          <h1 className="font-display text-3xl">Tu carrito esta vacio</h1>
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
    if (paymentMethod === "efectivo" && !isLocalPickup) {
      toast.error("El pago en efectivo solo esta disponible con retiro en local");
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
            calle: form.calle,
            numero: form.numero,
            piso: form.piso,
            ciudad: form.ciudad,
            provincia: form.provincia,
            codigo_postal: form.codigo_postal,
          },
          envio: {
            shipping_option_id: selectedShipping.id,
          },
<<<<<<< HEAD
          metodo_pago: paymentMethod,
=======
          pago: {
            metodo: paymentMethod,
          },
>>>>>>> e708b8bda8ce374b78fcf230bc919a09957cd739
          notas: form.notas || null,
        },
      });
      clear();
      const paymentUrl = res.initPoint ?? res.sandboxInitPoint;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else if (res.mpConfigured) {
        toast.error(res.error ?? "No se pudo iniciar el pago con Mercado Pago. Intenta de nuevo.");
      } else {
<<<<<<< HEAD
        toast.success(getSuccessMessage(paymentMethod));
=======
        toast.success(paymentMethod === "efectivo" ? "Pedido creado. Te esperamos en el local." : "Pedido creado. Te contactamos para coordinar el pago.");
>>>>>>> e708b8bda8ce374b78fcf230bc919a09957cd739
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
                <Field label="Telefono" value={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} required />
              </Grid>
            </Section>

            <Section title="Entrega">
              <Grid>
                <Field label="Calle" value={form.calle} onChange={(v) => setForm({ ...form, calle: v })} required={!isLocalPickup} />
                <Field label="Numero" value={form.numero} onChange={(v) => setForm({ ...form, numero: v })} />
                <Field label="Piso/Depto" value={form.piso} onChange={(v) => setForm({ ...form, piso: v })} />
                <Field label="Codigo postal" value={form.codigo_postal} onChange={(v) => setForm({ ...form, codigo_postal: v })} required={!isLocalPickup} />
                <Field label="Ciudad" value={form.ciudad} onChange={(v) => setForm({ ...form, ciudad: v })} required={!isLocalPickup} />
                <ProvinceField label="Provincia" value={form.provincia} onChange={setProvincia} required={!isLocalPickup} />
              </Grid>
              <div className="mt-4">
                <ShippingCalculator
                  provincia={form.provincia}
                  codigoPostal={form.codigo_postal}
                  ciudad={form.ciudad}
                  onShippingSelect={setShipping}
                  selectedShipping={selectedShipping?.codigo_servicio}
                />
              </div>
            </Section>

<<<<<<< HEAD
            <Section title="Metodo de pago">
              <PaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                allowCash={isLocalPickup}
                disabled={!selectedShipping}
              />
            </Section>
=======
            {selectedShipping && (
              <Section title="Metodo de pago">
                <div className="grid sm:grid-cols-2 gap-3">
                  <PaymentOption
                    value="transferencia_mp"
                    selected={paymentMethod}
                    onSelect={setPaymentMethod}
                    icon={<Landmark className="size-4" />}
                    title="Transferencia"
                    description="Pagas por Mercado Pago y el pedido se verifica automaticamente."
                  />
                  <PaymentOption
                    value="tarjeta"
                    selected={paymentMethod}
                    onSelect={setPaymentMethod}
                    icon={<CreditCard className="size-4" />}
                    title="Tarjeta"
                    description="Te redirigimos a Mercado Pago para completar y validar el pago."
                  />
                  {isLocalPickup && (
                    <PaymentOption
                      value="efectivo"
                      selected={paymentMethod}
                      onSelect={setPaymentMethod}
                      icon={<Banknote className="size-4" />}
                      title="Efectivo"
                      description="Disponible solo para retiro por el local."
                    />
                  )}
                </div>
                {paymentMethod === "tarjeta" && (
                  <div className="mt-3 border border-border bg-surface-elevated p-4 text-sm text-muted-foreground flex gap-3">
                    <ShieldCheck className="size-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Verificacion de tarjeta</p>
                      <p>La aprobacion se confirma con Mercado Pago. Cuando el pago figure aprobado, el pedido pasa a pagado automaticamente.</p>
                    </div>
                  </div>
                )}
              </Section>
            )}
>>>>>>> e708b8bda8ce374b78fcf230bc919a09957cd739

            <Section title="Notas (opcional)">
              <textarea
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                rows={3}
                className="w-full border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                placeholder="Aclaraciones para la entrega..."
              />
            </Section>
          </div>

          <aside className="lg:sticky lg:top-24 self-start space-y-4 border border-border p-5 bg-surface-elevated">
            <h2 className="font-display text-lg">Resumen</h2>
            <ul className="space-y-2 text-sm border-b border-border pb-3">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span className="line-clamp-1">{i.qty}x {i.nombre}</span>
                  <span className="shrink-0">{formatARS(i.precio * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatARS(total)}</span></div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1"><Truck className="size-3" /> Envio</span>
              <span>{selectedShipping ? selectedShipping.precio === 0 ? "Sin costo" : formatARS(selectedShipping.precio) : "A coordinar"}</span>
            </div>
            <div className="flex justify-between font-display text-xl pt-3 border-t border-border">
              <span>Total final</span>
              <span>{formatARS(finalTotal)}</span>
            </div>

            <button
              disabled={busy || !selectedShipping}
              className="w-full bg-primary text-primary-foreground py-3 font-display tracking-wide hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
<<<<<<< HEAD
              <CreditCard className="size-4" /> {busy ? "Procesando..." : getSubmitLabel(paymentMethod)}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              {paymentMethod === "tarjeta"
                ? "El servidor valida precios, envio y total antes de redirigirte a Mercado Pago."
                : "El servidor valida precios, envio y total antes de crear el pedido."}
=======
              {buttonIcon(paymentMethod)} {busy ? "Procesando..." : buttonText(paymentMethod)}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              {paymentMethod === "efectivo"
                ? "El servidor valida precios, retiro y total antes de crear el pedido."
                : "El servidor valida precios, envio y total antes de redirigirte a Mercado Pago."}
>>>>>>> e708b8bda8ce374b78fcf230bc919a09957cd739
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

function PaymentOption({
  value,
  selected,
  onSelect,
  icon,
  title,
  description,
}: {
  value: PaymentMethod;
  selected: PaymentMethod;
  onSelect: (value: PaymentMethod) => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  const active = value === selected;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`border p-4 text-left transition hover:border-primary ${active ? "border-primary bg-primary/5" : "border-border bg-background"}`}
      aria-pressed={active}
    >
      <span className="flex items-center gap-2 font-medium text-foreground">
        {icon}
        {title}
      </span>
      <span className="mt-2 block text-sm text-muted-foreground">{description}</span>
    </button>
  );
}

function buttonText(paymentMethod: PaymentMethod) {
  if (paymentMethod === "tarjeta") return "Pagar con tarjeta";
  if (paymentMethod === "efectivo") return "Confirmar pedido en efectivo";
  return "Pagar transferencia";
}

function buttonIcon(paymentMethod: PaymentMethod) {
  if (paymentMethod === "efectivo") return <Banknote className="size-4" />;
  if (paymentMethod === "transferencia_mp") return <Landmark className="size-4" />;
  return <CreditCard className="size-4" />;
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

function Field({
  label,
  value,
  onChange,
  required,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full mt-1 border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function PaymentMethodSelector({
  value,
  onChange,
  allowCash,
  disabled,
}: {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  allowCash: boolean;
  disabled: boolean;
}) {
  const options: Array<{
    value: PaymentMethod;
    title: string;
    subtitle: string;
    icon: LucideIcon;
    disabled?: boolean;
  }> = [
    {
      value: "tarjeta",
      title: "Tarjeta / Transferencia",
      subtitle: "Pagas de forma segura a través de Mercado Pago.",
      icon: CreditCard,
    },
    {
      value: "efectivo",
      title: "Efectivo en local",
      subtitle: "Pagá al retirar en nuestro local.",
      icon: Banknote,
      disabled: !allowCash,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          const isDisabled = disabled || option.disabled;
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={isDisabled}
              onClick={() => onChange(option.value)}
              className={`border px-4 py-3 text-left min-h-24 transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                selected ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/60"
              }`}
            >
              <span className="flex items-center gap-2 font-medium text-sm">
                <Icon className="size-4 text-primary" />
                {option.title}
              </span>
              <span className="mt-2 block text-xs text-muted-foreground leading-relaxed">{option.subtitle}</span>
            </button>
          );
        })}
      </div>

      {value === "tarjeta" && (
        <div className="border border-border bg-secondary/30 p-3 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <BadgeCheck className="size-4 text-primary" />
            Pago online por Mercado Pago
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Al confirmar, te redirigiremos a Mercado Pago para completar tu pago con tarjeta o transferencia. El pedido se procesará automáticamente.
          </p>
        </div>
      )}

      {value === "efectivo" && (
        <div className="border border-border bg-secondary/30 p-3 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Store className="size-4 text-primary" />
            Coordinar pago en el local
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Al confirmar tu pedido, reservaremos tus productos. Podés abonar en efectivo, débito o crédito directamente cuando retires en el local.
          </p>
        </div>
      )}
    </div>
  );
}

function getSubmitLabel(paymentMethod: PaymentMethod): string {
  if (paymentMethod === "efectivo") return "Confirmar retiro";
  return "Pagar con Mercado Pago";
}

function getSuccessMessage(paymentMethod: PaymentMethod): string {
  if (paymentMethod === "efectivo") return "¡Pedido creado! Coordinemos por WhatsApp.";
  return "¡Pedido creado con éxito!";
}

function ProvinceField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full mt-1 border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      >
        <option value="">Selecciona una provincia</option>
        {SHIPPING_PROVINCES.map((provincia) => (
          <option key={provincia} value={provincia}>
            {provincia}
          </option>
        ))}
      </select>
    </label>
  );
}

function findShippingProvince(value: string | null | undefined): string {
  const normalized = normalizeProvince(value ?? "");
  return SHIPPING_PROVINCES.find((provincia) => normalizeProvince(provincia) === normalized) ?? "";
}

function normalizeProvince(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
