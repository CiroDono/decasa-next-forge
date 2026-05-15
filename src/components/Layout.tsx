import { Link } from "@tanstack/react-router";
import { ShoppingCart, Search, MessageCircle, MapPin, User, LogOut, Shield } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useSession, useIsAdmin, signOut } from "@/lib/auth";
import { Chatbot } from "@/components/Chatbot";
import type { ReactNode } from "react";




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
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="size-9 bg-primary grid place-items-center font-display text-primary-foreground text-lg">
              D
            </div>
            <div className="leading-none">
              <div className="font-display text-lg tracking-wide">DECASAN</div>
              <div className="text-[10px] text-muted-foreground tracking-[0.2em]">HERRAMIENTAS</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium ml-6">
            <Link to="/productos" className="hover:text-primary">Catálogo</Link>
            {isAdmin && (
              <Link to="/admin" className="text-primary hover:text-primary/80 flex items-center gap-1">
                <Shield className="size-4" /> Admin
              </Link>
            )}
          </nav>

          <div className="flex-1" />

          <Link to="/productos" className="p-2 hover:text-primary" aria-label="Buscar">
            <Search className="size-5" />
          </Link>
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

      <footer className="bg-secondary text-secondary-foreground mt-16">
        <div className="container-x py-12 grid gap-8 md:grid-cols-4">
          <div>
            <div className="font-display text-xl">DECASAN</div>
            <p className="text-sm text-secondary-foreground/70 mt-2 max-w-xs">
              +60 años acompañando tus proyectos con herramientas, maquinaria y asesoramiento
              profesional para todo el país.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm mb-3 text-primary">Tienda</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li><Link to="/productos">Catálogo completo</Link></li>
              <li><Link to="/carrito">Carrito</Link></li>
              <li><Link to="/cuenta">Mi cuenta</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm mb-3 text-primary">Empresa</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li>La Falda, Córdoba</li>
              <li>Retiro en local</li>
              <li>Envíos a todo el país</li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm mb-3 text-primary">Contacto</h4>
            <a href={WA_URL} target="_blank" rel="noreferrer" className="text-sm hover:text-primary">
              3548403666
            </a>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container-x py-4 text-xs text-secondary-foreground/60">
            © {new Date().getFullYear()} Decasan Herramientas. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      <a
        href={WA_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Consultar por WhatsApp"
        className="fixed bottom-24 right-5 z-40 bg-success text-success-foreground rounded-full p-3 shadow-lg hover:scale-105 transition"
      >
        <MessageCircle className="size-5" />
      </a>

      <Chatbot />
    </div>
  );
}
