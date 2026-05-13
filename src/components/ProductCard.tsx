import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { formatARS } from "@/lib/format";
import type { Producto } from "@/lib/products";

export function ProductCard({ p }: { p: Producto }) {
  const inStock = (p.stock ?? 0) > 0;
  return (
    <Link
      to="/productos/$id"
      params={{ id: String(p.id) }}
      className="group bg-card border border-border hover:border-primary/60 transition flex flex-col"
    >
      <div className="aspect-square bg-muted grid place-items-center text-muted-foreground/40 relative overflow-hidden">
        <Package className="size-16 group-hover:scale-110 transition" strokeWidth={1} />
        <span
          className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
            inStock ? "bg-success text-success-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          {inStock ? "En stock" : "Sin stock"}
        </span>
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {p.categoria}
          {p.grupo ? ` · ${p.grupo}` : ""}
        </div>
        <div className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary">
          {p.nombre}
        </div>
        <div className="mt-auto pt-2 font-display text-lg text-foreground">
          {formatARS(p.precio)}
        </div>
      </div>
    </Link>
  );
}
