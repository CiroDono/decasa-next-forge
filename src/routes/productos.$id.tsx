import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Package,
  ShoppingCart,
  Truck,
  Store,
  ShieldCheck,
  ArrowLeft,
  Minus,
  Plus,
  Check,
  ChevronRight,
  Wrench,
  CreditCard,
  MessageCircle,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducto, fetchProductos, type Producto } from "@/lib/products";
import { formatARS } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/productos/$id")({
  component: ProductDetail,
  head: ({ params }) => ({
    meta: [
      { title: `Producto #${params.id} — Decasan Herramientas` },
      {
        name: "description",
        content:
          "Comprá herramientas, maquinaria y productos industriales con asesoramiento profesional y envíos a todo el país.",
      },
    ],
  }),
});

function ProductDetail() {
  const { id } = Route.useParams();
  const productId = Number(id);
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);

  const product = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProducto(productId),
  });

  const related = useQuery({
    queryKey: ["related", product.data?.grupo, product.data?.categoria],
    enabled: !!product.data,
    queryFn: () =>
      fetchProductos({
        grupo: product.data?.grupo ?? undefined,
        cat: product.data?.grupo ? undefined : product.data?.categoria ?? undefined,
        limit: 12,
      }),
  });

  if (product.isLoading) {
    return (
      <Layout>
        <div className="container-x py-16 grid md:grid-cols-2 gap-10">
          <div className="aspect-square bg-muted animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 w-1/3 bg-muted animate-pulse" />
            <div className="h-10 w-3/4 bg-muted animate-pulse" />
            <div className="h-12 w-1/2 bg-muted animate-pulse" />
            <div className="h-32 bg-muted animate-pulse" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!product.data) throw notFound();
  const p = product.data;
  const inStock = (p.stock ?? 0) > 0;
  const lowStock = inStock && (p.stock ?? 0) <= 3;

  const variantes: Producto[] = (related.data?.items ?? []).filter(
    (r) => r.id !== p.id && p.grupo && r.grupo === p.grupo,
  );
  const recomendados: Producto[] = (related.data?.items ?? [])
    .filter((r) => r.id !== p.id && (!p.grupo || r.grupo !== p.grupo))
    .slice(0, 4);

  // Parse description into bullet points if it has bullet markers
  const descLines = (p.descripcion ?? "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const specs = descLines.filter((l) => /^[•\-·]/.test(l)).map((l) => l.replace(/^[•\-·]\s*/, ""));
  const intro = descLines.filter((l) => !/^[•\-·]/.test(l)).join("\n");

  const priceNum = (p.precio ?? 0) / 100;
  const cuota3 = priceNum / 3;

  const addToCart = () => {
    add(
      { id: p.id, nombre: p.nombre ?? "", precio: p.precio ?? 0, sku: p.sku },
      qty,
    );
    toast.success(`${qty} × agregado al carrito`, { description: p.nombre ?? "" });
  };

  return (
    <Layout>
      {/* breadcrumb */}
      <div className="border-b border-border bg-surface">
        <div className="container-x py-3 flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-primary">Inicio</Link>
          <ChevronRight className="size-3" />
          <Link to="/productos" className="hover:text-primary">Catálogo</Link>
          {p.categoria && (
            <>
              <ChevronRight className="size-3" />
              <span className="hover:text-primary">{p.categoria}</span>
            </>
          )}
          {p.grupo && (
            <>
              <ChevronRight className="size-3" />
              <span>{p.grupo}</span>
            </>
          )}
          <ChevronRight className="size-3" />
          <span className="text-foreground font-medium truncate">{p.nombre}</span>
        </div>
      </div>

      <div className="container-x py-8 lg:py-12">
        <Link
          to="/productos"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="size-3.5" /> Volver al catálogo
        </Link>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] gap-8 lg:gap-14">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square bg-gradient-to-br from-muted via-surface to-muted border border-border overflow-hidden group">
              {/* corner ticks */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary" />

              {/* grid texture */}
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />

              <div className="absolute inset-0 grid place-items-center">
                <Package
                  className="size-48 text-foreground/20 group-hover:scale-105 transition-transform duration-700"
                  strokeWidth={0.8}
                />
              </div>

              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {inStock ? (
                  <span className="bg-success text-success-foreground text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 inline-flex items-center gap-1.5">
                    <Check className="size-3" /> Disponible
                  </span>
                ) : (
                  <span className="bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1">
                    Sin stock
                  </span>
                )}
                {lowStock && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1">
                    Últimas {p.stock} unidades
                  </span>
                )}
              </div>

              <div className="absolute bottom-4 right-4 text-[10px] uppercase tracking-[0.25em] text-muted-foreground bg-surface-elevated/80 backdrop-blur px-2 py-1">
                SKU {p.sku ?? p.id}
              </div>
            </div>

            {/* thumbnail row (decorative) */}
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`aspect-square border bg-muted/50 grid place-items-center ${
                    i === 0 ? "border-primary" : "border-border"
                  }`}
                >
                  <Package className="size-8 text-muted-foreground/40" strokeWidth={1} />
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="text-[11px] uppercase tracking-[0.3em] text-primary mb-3 font-semibold">
              {p.categoria ?? "Producto"}
              {p.grupo ? ` · ${p.grupo}` : ""}
            </div>
            <h1 className="font-display text-3xl md:text-4xl leading-[1.05]">{p.nombre}</h1>

            <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
              <span>SKU: {p.sku ?? "—"}</span>
              <span className="size-1 rounded-full bg-border" />
              <span>50 años de experiencia</span>
            </div>

            {/* Price block */}
            <div className="mt-6 border-t border-b border-border py-6">
              <div className="font-display text-4xl md:text-5xl text-foreground">
                {formatARS(p.precio)}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                o 3 cuotas sin interés de{" "}
                <span className="text-foreground font-semibold">
                  {new Intl.NumberFormat("es-AR", {
                    style: "currency",
                    currency: "ARS",
                    maximumFractionDigits: 0,
                  }).format(cuota3)}
                </span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-success font-medium">
                <Truck className="size-3.5" /> Envío gratis a todo el país en compras superiores a $200.000
              </div>
            </div>

            {/* Variants */}
            {variantes.length > 0 && (
              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-wider mb-3">
                  Otras variantes ({variantes.length})
                </div>
                <div className="grid gap-2">
                  {variantes.slice(0, 5).map((v) => (
                    <Link
                      key={v.id}
                      to="/productos/$id"
                      params={{ id: String(v.id) }}
                      className="flex justify-between items-center border border-border px-3 py-2.5 hover:border-primary hover:bg-accent/30 text-sm transition"
                    >
                      <span className="truncate pr-3">{v.nombre}</span>
                      <span className="font-display text-base shrink-0">{formatARS(v.precio)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + CTA */}
            <div className="mt-6 flex items-stretch gap-3">
              <div className="inline-flex items-stretch border border-border">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 hover:bg-muted disabled:opacity-40"
                  disabled={qty <= 1}
                  aria-label="Disminuir"
                >
                  <Minus className="size-4" />
                </button>
                <div className="w-10 grid place-items-center font-display text-lg select-none">
                  {qty}
                </div>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="px-3 hover:bg-muted"
                  aria-label="Aumentar"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <button
                disabled={!inStock}
                onClick={addToCart}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display tracking-wider px-6 py-3.5 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ShoppingCart className="size-4" /> Agregar al carrito
              </button>
            </div>

            <a
              href={`https://wa.me/5493548000000?text=${encodeURIComponent(`Hola Decasan, consulto por: ${p.nombre} (SKU ${p.sku ?? p.id})`)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 w-full inline-flex items-center justify-center gap-2 border border-border px-6 py-3 font-medium text-sm hover:border-primary hover:text-primary transition"
            >
              <MessageCircle className="size-4" /> Consultar disponibilidad o stock mayorista
            </a>

            {/* Trust strip */}
            <div className="mt-8 grid grid-cols-2 gap-px bg-border border border-border">
              {[
                { i: Truck, t: "Envíos al país", s: "Despacho en 24-48hs" },
                { i: Store, t: "Retiro en local", s: "La Falda, Córdoba" },
                { i: CreditCard, t: "Pago seguro", s: "Mercado Pago" },
                { i: ShieldCheck, t: "Garantía oficial", s: "Productos originales" },
              ].map(({ i: Icon, t, s }) => (
                <div key={t} className="bg-surface-elevated p-3 flex items-start gap-2.5">
                  <Icon className="size-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold leading-tight">{t}</div>
                    <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description + Specs */}
        {(intro || specs.length > 0) && (
          <section className="mt-16 grid lg:grid-cols-3 gap-8 lg:gap-12 border-t border-border pt-12">
            <div className="lg:col-span-1">
              <div className="inline-flex items-center gap-2 text-primary mb-3">
                <Wrench className="size-4" />
                <span className="text-[11px] font-bold uppercase tracking-[0.25em]">
                  Ficha técnica
                </span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl leading-tight">
                Información del producto
              </h2>
              <p className="text-sm text-muted-foreground mt-3 max-w-xs">
                Toda la información que necesitás para tomar la mejor decisión.
              </p>
            </div>

            <div className="lg:col-span-2 space-y-8">
              {intro && (
                <div>
                  <h3 className="font-display text-sm mb-3 text-muted-foreground">Descripción</h3>
                  <p className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-line">
                    {intro}
                  </p>
                </div>
              )}

              {specs.length > 0 && (
                <div>
                  <h3 className="font-display text-sm mb-3 text-muted-foreground">
                    Especificaciones
                  </h3>
                  <ul className="grid sm:grid-cols-2 gap-px bg-border border border-border">
                    {specs.map((s, i) => (
                      <li
                        key={i}
                        className="bg-surface-elevated p-3.5 text-sm flex items-start gap-2"
                      >
                        <Check className="size-4 text-primary mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Related */}
      {recomendados.length > 0 && (
        <section className="border-t border-border bg-surface">
          <div className="container-x py-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="text-[11px] uppercase tracking-[0.3em] text-primary font-semibold mb-2">
                  También te puede interesar
                </div>
                <h3 className="font-display text-2xl md:text-3xl">Productos relacionados</h3>
              </div>
              <Link
                to="/productos"
                className="hidden sm:inline-flex items-center gap-1 text-sm hover:text-primary"
              >
                Ver catálogo <ChevronRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {recomendados.map((r) => (
                <ProductCard key={r.id} p={r} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sticky mobile bar */}
      <div className="lg:hidden sticky bottom-0 z-30 bg-surface-elevated border-t border-border p-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</div>
          <div className="font-display text-lg leading-none">
            {formatARS((p.precio ?? 0) * qty)}
          </div>
        </div>
        <button
          disabled={!inStock}
          onClick={addToCart}
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display tracking-wider px-5 py-3 hover:bg-primary/90 disabled:opacity-50"
        >
          <ShoppingCart className="size-4" /> Agregar
        </button>
      </div>
    </Layout>
  );
}
