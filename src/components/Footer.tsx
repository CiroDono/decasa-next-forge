import { Wrench, Facebook, Instagram, MapPin, Phone, Mail, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gradient-dark text-white pt-16 pb-8 border-t border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <a href="#inicio" className="flex items-center gap-2 mb-4">
              <div className="size-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-glow">
                <Wrench className="size-5 text-accent-foreground" strokeWidth={2.5} />
              </div>
              <div className="leading-tight">
                <div className="font-bold text-lg">Decasan</div>
                <div className="text-[10px] uppercase tracking-widest text-white/50 -mt-0.5">Herramientas</div>
              </div>
            </a>
            <p className="text-sm text-white/60 leading-relaxed mb-4">
              Ferretería, herramientas y materiales en La Falda. +20 años acompañando proyectos.
            </p>
            <div className="flex gap-2">
              <a href="#" aria-label="Facebook" className="size-9 rounded-lg glass-dark flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
                <Facebook className="size-4" />
              </a>
              <a href="#" aria-label="Instagram" className="size-9 rounded-lg glass-dark flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors">
                <Instagram className="size-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4">Links rápidos</h4>
            <ul className="space-y-2.5 text-sm text-white/70">
              <li><a href="#inicio" className="hover:text-accent transition-colors">Inicio</a></li>
              <li><a href="#productos" className="hover:text-accent transition-colors">Productos</a></li>
              <li><a href="#marcas" className="hover:text-accent transition-colors">Marcas</a></li>
              <li><a href="#nosotros" className="hover:text-accent transition-colors">Nosotros</a></li>
              <li><a href="#contacto" className="hover:text-accent transition-colors">Contacto</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-2"><MapPin className="size-4 text-accent shrink-0 mt-0.5" /><span>Av. Pres. Kennedy 270, La Falda, Córdoba</span></li>
              <li className="flex items-start gap-2"><Phone className="size-4 text-accent shrink-0 mt-0.5" /><a href="tel:+543548592127" className="hover:text-accent">+54 3548 59-2127</a></li>
              <li className="flex items-start gap-2"><Mail className="size-4 text-accent shrink-0 mt-0.5" /><span>info@decasan.com.ar</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Clock className="size-4 text-accent" /> Horarios</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex justify-between"><span>Lun a Vie</span><span className="text-white">08:30—20:30</span></li>
              <li className="flex justify-between"><span>Sábado</span><span className="text-white">08:30—20:30</span></li>
              <li className="flex justify-between"><span>Domingo</span><span className="text-white/50">Cerrado</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/50">
          <div>© {new Date().getFullYear()} Decasan Herramientas. Todos los derechos reservados.</div>
          <div>La Falda · Córdoba · Argentina</div>
        </div>
      </div>
    </footer>
  );
}
