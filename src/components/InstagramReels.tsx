import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Instagram } from "lucide-react";

interface Reel {
  id: string;
  url: string;
  title: string;
}

const FEATURED_REELS: Reel[] = [
  {
    id: "1",
    url: "https://www.instagram.com/reel/ABC123/embed",
    title: "Técnicas de herramientas",
  },
  {
    id: "2",
    url: "https://www.instagram.com/reel/DEF456/embed",
    title: "Proyectos destacados",
  },
  {
    id: "3",
    url: "https://www.instagram.com/reel/GHI789/embed",
    title: "Tips profesionales",
  },
];

export function InstagramReels() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar viewport size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Intersection Observer para animaciones
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? FEATURED_REELS.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === FEATURED_REELS.length - 1 ? 0 : prev + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section
      ref={sectionRef}
      id="instagram-reels"
      className="py-20 lg:py-28 bg-gradient-to-b from-surface to-surface-elevated"
    >
      <div className="container-x">
        {/* HEADER */}
        <div
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-1000 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="size-1 bg-primary rounded-full" />
            <span className="inline-block text-sm font-extrabold uppercase tracking-widest text-primary">
              Contenido inspirador
            </span>
            <div className="size-1 bg-primary rounded-full" />
          </div>

          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-4 leading-[1.1]">
            Seguinos en{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                Instagram
              </span>
              <div className="absolute -inset-1 bg-primary/10 blur-lg -z-10" />
            </span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Descubrí nuestros mejores trabajos, tips profesionales y proyectos
            destacados. Dale like, comenta y síguenos para estar siempre
            actualizado.
          </p>

          <a
            href="https://www.instagram.com/decasan.herramientas"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium rounded-lg hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 group"
          >
            <Instagram className="size-5 group-hover:scale-110 transition-transform" />
            Ver más contenido
          </a>
        </div>

        {/* REELS GRID - DESKTOP */}
        <div
          ref={containerRef}
          className={`hidden lg:grid grid-cols-3 gap-6 transition-all duration-1000 delay-200 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          {FEATURED_REELS.map((reel, idx) => (
            <div
              key={reel.id}
              className="group relative overflow-hidden rounded-2xl aspect-[9/16] bg-muted border border-border shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {/* Background gradient para loadings */}
              <div className="absolute inset-0 bg-gradient-to-br from-surface-elevated via-muted to-muted opacity-50" />

              {/* Instagram Embed */}
              <div className="relative size-full overflow-hidden">
                <iframe
                  src={reel.url}
                  width="100%"
                  height="100%"
                  className="size-full border-0"
                  loading="lazy"
                  title={reel.title}
                />
              </div>

              {/* Overlay gradient - hover effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-sm font-medium">{reel.title}</p>
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 pointer-events-none" />
            </div>
          ))}
        </div>

        {/* REELS CAROUSEL - MOBILE */}
        <div
          className={`lg:hidden transition-all duration-1000 delay-200 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <div className="relative">
            {/* Carousel container */}
            <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-muted border border-border">
              <div className="absolute inset-0 bg-gradient-to-br from-surface-elevated via-muted to-muted opacity-50" />

              <div className="relative size-full overflow-hidden">
                <iframe
                  src={FEATURED_REELS[currentIndex].url}
                  width="100%"
                  height="100%"
                  className="size-full border-0"
                  loading="lazy"
                  title={FEATURED_REELS[currentIndex].title}
                />
              </div>

              {/* Navigation buttons */}
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 size-10 bg-background/80 backdrop-blur-sm border border-border rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors z-10"
                aria-label="Reel anterior"
              >
                <ChevronLeft className="size-5" />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-10 bg-background/80 backdrop-blur-sm border border-border rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors z-10"
                aria-label="Reel siguiente"
              >
                <ChevronRight className="size-5" />
              </button>

              {/* Slide indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {FEATURED_REELS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentIndex
                        ? "bg-primary w-6"
                        : "bg-white/40 w-2 hover:bg-white/60"
                    }`}
                    aria-label={`Ir al reel ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Title below carousel */}
            <div className="mt-4 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                {currentIndex + 1} / {FEATURED_REELS.length}
              </p>
              <p className="text-foreground font-medium mt-1">
                {FEATURED_REELS[currentIndex].title}
              </p>
            </div>
          </div>
        </div>

        {/* CALL TO ACTION */}
        <div
          className={`mt-16 text-center transition-all duration-1000 delay-300 ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <p className="text-muted-foreground mb-4">
            ¿Te gustó? Compartí tus experiencias con nuestros productos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://www.instagram.com/decasan.herramientas"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2 group"
            >
              <Instagram className="size-5 group-hover:scale-110 transition-transform" />
              Síguenos en Instagram
            </a>
            <a
              href="https://www.instagram.com/decasan.herramientas"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-border text-foreground font-medium rounded-lg hover:border-primary hover:text-primary transition-colors"
            >
              Etiquétanos
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
