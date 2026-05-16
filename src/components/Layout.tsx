import { Link } from "@tanstack/react-router";
import { ShoppingCart, MapPin, User, LogOut, Shield } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useSession, useIsAdmin, signOut } from "@/lib/auth";
import { Chatbot } from "@/components/Chatbot";
import { HeaderSearch } from "@/components/HeaderSearch";
import { Footer } from "@/components/Footer";
import type { ReactNode } from "react";

const WHATSAPP = "5493548403666";
const WA_URL = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  "Hola Decasan, quiero hacer una consulta.",
)}`;

export function Layout({ children }: { children: ReactNode }) {
  const count = useCart((s) => s.items.reduce((a, b) => a + b.qty, 0));
  const { user } = useSession();
  const { data: isAdmin } = useIsAdmin(user);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="bg-secondary text-secondary-foreground text-xs">
        <div className="container-x flex items-center justify-between py-2">
          <span className="flex items-center gap-2">
            <MapPin className="size-3.5" /> La Falda, Córdoba — Envíos a todo el país
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-surface-elevated/90 backdrop-blur">
        <div className="container-x flex items-center gap-4 py-4">
          <Link to="/" className="shrink-0" >
              <img src="/logo.png" alt="Decasan" className="h-20 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium ml-6">
            <Link to="/productos" className="hover:text-primary">Catálogo</Link>
            {isAdmin && (
              <Link to="/admin" className="text-primary hover:text-primary/80 flex items-center gap-1">
                <Shield className="size-4" /> Admin
              </Link>
            )}
          </nav>

          <div className="flex-1 flex justify-center px-2">
            <HeaderSearch />
          </div>

          {user ? (
            <>
              <Link to="/cuenta" className="p-2 hover:text-primary" aria-label="Mi cuenta">
                <User className="size-5" />
              </Link>
              <button onClick={signOut} className="p-2 hover:text-primary" aria-label="Cerrar sesión">
                <LogOut className="size-5" />
              </button>
            </>
          ) : (
            <Link to="/login" className="p-2 hover:text-primary text-sm font-medium">
              Ingresar
            </Link>
          )}
          <Link to="/carrito" className="relative p-2 hover:text-primary" aria-label="Carrito">
            <ShoppingCart className="size-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full size-4 grid place-items-center">
                {count}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <Footer />

      <Chatbot />
    </div>
  );
}
