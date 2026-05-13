import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { fetchProductos, fetchCategorias } from "@/lib/products";

type Search = { q?: string; cat?: string; page?: number };

export const Route = createFileRoute("/productos")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    cat: typeof s.cat === "string" ? s.cat : undefined,
    page: typeof s.page === "number" ? s.page : undefined,
  }),
  component: Catalog,
});

const PAGE_SIZE = 24;

function Catalog() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [qLocal, setQLocal] = useState(search.q ?? "");
  const page = search.page ?? 1;

  const cats = useQuery({ queryKey: ["cats"], queryFn: fetchCategorias });
  const products = useQuery({
    queryKey: ["products", search.q, search.cat, page],
    queryFn: () =>
      fetchProductos({
        q: search.q,
        cat: search.cat,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
  });

  const totalPages = Math.max(1, Math.ceil((products.data?.count ?? 0) / PAGE_SIZE));

  return (
    <Layout>
      <div className="bg-secondary text-secondary-foreground">
        <div className="container-x py-10">
          <div className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Catálogo</div>
          <h1 className="font-display text-3xl md:text-5xl">
            {search.cat ?? "Todos los productos"}
          </h1>
          <p className="text-secondary-foreground/70 mt-2 text-sm">
            {products.data?.count ?? "—"} productos
          </p>
        </div>
      </div>

      <div className="container-x py-8 grid lg:grid-cols-[240px_1fr] gap-8">
        {/* sidebar */}
        <aside className="space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ search: { ...search, q: qLocal || undefined, page: 1 } });
            }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="search"
              value={qLocal}
              onChange={(e) => setQLocal(e.target.value)}
              placeholder="Buscar producto, SKU…"
              className="w-full bg-card border border-input pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </form>

          <div>
            <h3 className="font-display text-sm mb-3">Categorías</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  to="/productos"
                  search={{ q: search.q }}
                  className={`block py-1 hover:text-primary ${!search.cat ? "text-primary font-medium" : ""}`}
                >
                  Todas
                </Link>
              </li>
              {(cats.data ?? []).map((c) => (
                <li key={c}>
                  <Link
                    to="/productos"
                    search={{ q: search.q, cat: c }}
                    className={`block py-1 hover:text-primary ${search.cat === c ? "text-primary font-medium" : ""}`}
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {(search.q || search.cat) && (
            <button
              type="button"
              onClick={() => {
                setQLocal("");
                navigate({ search: {} });
              }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" /> Limpiar filtros
            </button>
          )}
        </aside>

        {/* grid */}
        <div>
          {products.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-muted animate-pulse" />
              ))}
            </div>
          ) : products.data?.items.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No se encontraron productos.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {products.data?.items.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {Array.from({ length: Math.min(totalPages, 8) }).map((_, i) => {
                    const p = i + 1;
                    return (
                      <Link
                        key={p}
                        to="/productos"
                        search={{ ...search, page: p }}
                        className={`size-9 grid place-items-center text-sm border ${
                          p === page
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {p}
                      </Link>
                    );
                  })}
                  {totalPages > 8 && <span className="text-muted-foreground">…</span>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
