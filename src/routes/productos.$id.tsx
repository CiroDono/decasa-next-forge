import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingCart, Truck, Store, ShieldCheck, ArrowLeft } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducto, fetchProductos } from "@/lib/products";
import { formatARS } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/productos/$id")({
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const productId = Number(id);
  const add = useCart((s) => s.add);

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
        limit: 8,
      }),
  });

  if (product.isLoading) {
    return (
      <Layout>
        <div className="container-x py-16">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted animate-pulse" />
            <div className="space-y-3">
              <div className="h-6 w-1/2 bg-muted animate-pulse" />
              <div className="h-10 w-3/4 bg-muted animate-pulse" />
              <div className="h-32 bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product.data) throw notFound();
  const p = product.data;
  const inStock = (p.stock ?? 0) > 0;

  const variantes = (related.data?.items ?? []).filter((r) => r.id !== p.id && p.grupo && r.grupo === p.grupo);
  const recomendados = (related.data?.items ?? []).filter((r) => r.id !== p.id).slice(0, 4);

  return (
    <Layout>
      <div className="container-x py-6 text-xs text-muted-foreground">
        <Link to="/productos" className="inline-flex items-center gap-1 hover:text-primary">
          <ArrowLeft className="size-3" /> Volver al catálogo
        </Link>
      </div>

      <div className="container-x grid md:grid-cols-2 gap-8 lg:gap-12 pb-12">
        <div className="bg-muted aspect-square grid place-items-center text-muted-foreground/40">
          <Package className="size-32" strokeWidth={1} />
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">
            {p.categoria}
            {p.grupo ? ` · ${p.grupo}` : ""}
          </div>
          <h1 className="font-display text-3xl md:text-4xl leading-tight">{p.nombre}</h1>
          <div className="text-xs text-muted-foreground mt-2">SKU: {p.sku ?? "—"}</div>

          <div className="flex items-center gap-3 mt-6">
            <div className="font-display text-4xl">{formatARS(p.precio)}</div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 ${
                inStock ? "bg-success text-success-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {inStock ? "En stock" : "Sin stock"}
            </span>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              disabled={!inStock}
              onClick={() => {
                add(
                  { id: p.id, nombre: p.nombre ?? "", precio: p.precio ?? 0, sku: p.sku },
                  1,
                );
                toast.success("Agregado al carrito", { description: p.nombre ?? "" });
              }}
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display tracking-wide px-6 py-3 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="size-4" /> Agregar al carrito
            </button>
            <a
              href={`https://wa.me/5493548000000?text=${encodeURIComponent(`Hola, consulto por: ${p.nombre} (SKU ${p.sku ?? p.id})`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-border px-6 py-3 font-display tracking-wide hover:border-primary hover:text-primary"
            >
              Consultar por WhatsApp
            </a>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
            {[
              { i: Truck, t: "Envío nacional" },
              { i: Store, t: "Retiro en local" },
              { i: ShieldCheck, t: "Pago seguro" },
            ].map(({ i: Icon, t }) => (
              <div key={t} className="flex items-center gap-2 bg-muted p-3">
                <Icon className="size-4 text-primary" />
                <span>{t}</span>
              </div>
            ))}
          </div>

          {variantes.length > 0 && (
            <div className="mt-8">
              <h3 className="font-display text-sm mb-3">Otras presentaciones</h3>
              <div className="space-y-2">
                {variantes.map((v) => (
                  <Link
                    key={v.id}
                    to="/productos/$id"
                    params={{ id: String(v.id) }}
                    className="flex justify-between items-center border border-border p-3 hover:border-primary text-sm"
                  >
                    <span>{v.nombre}</span>
                    <span className="font-display">{formatARS(v.precio)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {p.descripcion && (
            <div className="mt-10">
              <h3 className="font-display text-sm mb-3">Descripción</h3>
              <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                {p.descripcion}
              </p>
            </div>
          )}
        </div>
      </div>

      {recomendados.length > 0 && (
        <section className="container-x py-12 border-t border-border">
          <h3 className="font-display text-2xl mb-6">Productos relacionados</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recomendados.map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
}
