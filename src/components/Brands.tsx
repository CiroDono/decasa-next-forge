const brands = [
  { name: "Bosch", image: null },
  { name: "DeWalt", image: "/brands/dewalt.jpg" },
  { name: "Lusqtoff", image: null },
  { name: "Hamilton", image: null },
  { name: "Bremen", image: null },
  { name: "Total", image: null },
  { name: "Milwaukee", image: null },
  { name: "Otras", image: null }
];

export function Brands() {
  return (
    <section id="marcas" className="py-16 lg:py-20 bg-background border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-2">Marcas</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Trabajamos con las mejores marcas</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {brands.map((brand) => (
            <div
              key={brand.name}
              className="aspect-[3/2] bg-surface border border-border rounded-xl flex items-center justify-center text-foreground/70 font-bold text-sm hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 hover:shadow-card transition-all overflow-hidden"
            >
              {brand.image ? (
                <img src={brand.image} alt={brand.name} className="w-full h-full object-contain p-4" />
              ) : (
                brand.name
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
