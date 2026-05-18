import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Instagram, Play } from "lucide-react";

interface Reel {
  id: string;
  url: string;
  title: string;
}

const FEATURED_REELS: Reel[] = [
  {
    id: "1",
    url: "https://www.instagram.com/reel/DYR8dscmilD/",
    title: "Oferta imperdible",
  },
  {
    id: "2",
    url: "https://www.instagram.com/reel/DXt2by-AKhi/",
    title: "Tips profesionales",
  },
  {
    id: "3",
    url: "https://www.instagram.com/reel/DXhSmb4DYnZ/",
    title: "Ganadores del sorteo",
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
            Descubrí nuestras ofertas, tips profesionales y proyectos
            destacados.
          </p>

          <a
            href="https://www.instagram.com/decasanherramientas/"
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
          {FEATURED_REELS.map((reel) => (
            <a
              key={reel.id}
              href={reel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl aspect-[9/16] bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-border shadow-lg hover:shadow-xl hover:border-primary transition-all duration-300"
            >
              {/* Background pattern */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-primary/20 transition-transform group-hover:scale-110 duration-500">
                  <Instagram className="size-32" strokeWidth={0.5} />
                </div>
              </div>

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Play button icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="size-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-white/30 transition-all">
                  <Play className="size-7 text-white fill-white" />
                </div>
              </div>

              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-sm font-medium">{reel.title}</p>
                <p className="text-white/70 text-xs mt-2 flex items-center gap-1">
                  <Instagram className="size-3" /> Ver en Instagram
                </p>
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 pointer-events-none" />
            </a>
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
            <a
              href={FEATURED_REELS[currentIndex].url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-[9/16] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-border cursor-pointer hover:border-primary transition-all duration-300"
            >
              {/* Background pattern */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-primary/20 transition-transform group-hover:scale-110 duration-500">
                  <Instagram className="size-32" strokeWidth={0.5} />
                </div>
              </div>

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Play button icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="size-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-white/30 transition-all">
                  <Play className="size-7 text-white fill-white" />
                </div>
              </div>

              {/* Navigation buttons */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handlePrev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 size-10 bg-background/80 backdrop-blur-sm border border-border rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors z-10"
                aria-label="Reel anterior"
              >
                <ChevronLeft className="size-5" />
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleNext();
                }}
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
                    onClick={(e) => {
                      e.preventDefault();
                      goToSlide(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentIndex
                        ? "bg-primary w-6"
                        : "bg-white/40 w-2 hover:bg-white/60"
                    }`}
                    aria-label={`Ir al reel ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-sm font-medium">
                  {FEATURED_REELS[currentIndex].title}
                </p>
                <p className="text-white/70 text-xs mt-2 flex items-center gap-1">
                  <Instagram className="size-3" /> Ver en Instagram
                </p>
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 pointer-events-none" />
            </a>

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

      </div>
    </section>
  );
}
