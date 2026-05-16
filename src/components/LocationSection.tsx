import { MapPin, Phone, MessageCircle } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/5493548592127";

export function LocationSection() {
  return (
    <section id="contacto" className="py-20 lg:py-28 bg-surface">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3"><strong>Visitanos</strong></span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
            Estamos en el corazón de <span className="text-primary">La Falda</span>
          </h2>
          <p className="text-muted-foreground text-lg">Pasá por el local, te atendemos personalmente.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 rounded-2xl overflow-hidden shadow-lg border border-border h-[420px] lg:h-auto">
            <iframe
              title="Ubicación Decasan Herramientas"
              src="https://www.google.com/maps?q=Av.+Pres.+Kennedy+270,+La+Falda,+C%C3%B3rdoba&output=embed"
              className="w-full h-full min-h-[420px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface-elevated rounded-2xl p-6 border border-border shadow-card">
              <div className="flex items-start gap-3 mb-1">
                <MapPin className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Dirección</div>
                  <div className="font-semibold text-foreground">Av. Pres. Kennedy 270</div>
                  <div className="text-sm text-muted-foreground">La Falda, Córdoba, Argentina</div>
                </div>
              </div>
            </div>

            <div className="bg-surface-elevated rounded-2xl p-6 border border-border shadow-card">
              <div className="flex items-start gap-3 mb-4">
                <Phone className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Teléfono</div>
                  <a className="text-lg font-bold text-foreground hover:text-primary transition-colors">
                    +54 3548 59-2127
                  </a>
                </div>
              </div>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-transform hover:-translate-y-0.5"
              >
                <MessageCircle className="size-5" /> Escribir por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
