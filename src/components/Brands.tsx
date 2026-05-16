const brands = ["Bosch", "DeWalt", "Lusqtoff", "Hamilton", "Bremen", "Total", "Milwaukee", "Otras" ];

export function Brands() {
  return (
    <section id="marcas" className="py-16 lg:py-20 bg-background border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-accent mb-2">Marcas</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Trabajamos con las mejores marcas</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {brands.map((b) => (
            <div
              key={b}
              className="aspect-[3/2] bg-surface border border-border rounded-xl flex items-center justify-center text-foreground/70 font-bold text-sm hover:border-accent hover:bg-accent hover:text-accent-foreground hover:shadow-card transition-all"
            >
              {b}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
