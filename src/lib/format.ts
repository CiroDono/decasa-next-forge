// Prices in DB appear stored as integer * 100 (cents-like). Display as ARS.
export function formatARS(value: number | null | undefined): string {
  if (value == null) return "$ —";
  const n = Number(value) / 100;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
