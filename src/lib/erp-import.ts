export type ErpImportRow = {
  sku: string;
  nombre: string;
  codigo_fabricante: string | null;
  precio_vta_sin_iva: number | null;
  precio: number;
};

const FIELD_ALIASES = {
  sku: ["codigo", "código", "sku", "cod", "cod_producto", "codigo_producto"],
  codigo_fabricante: ["codigo_fabricante", "código_fabricante", "cod_fabricante", "fabricante"],
  nombre: ["nombre", "producto", "descripcion", "descripción", "detalle"],
  precio_vta_sin_iva: ["precio_vta_sin_iva", "precio_sin_iva", "p_vta_sin_iva"],
  precio: ["precio_de_venta", "precio_venta", "precio_vta", "precio", "precio_final"],
} as const;

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeSku(value: unknown) {
  return String(value ?? "").trim();
}

function parseMoney(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d,.-]/g, "");
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  const normalized = hasComma && hasDot
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getValue(row: Record<string, unknown>, aliases: readonly string[]) {
  const keys = Object.keys(row);
  const normalized = new Map(keys.map((key) => [normalizeHeader(key), key]));
  for (const alias of aliases) {
    const key = normalized.get(normalizeHeader(alias));
    if (key) return row[key];
  }
  return null;
}

export async function parseErpExcelFile(file: File): Promise<ErpImportRow[]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("El archivo no tiene hojas.");
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const parsed: ErpImportRow[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const sku = normalizeSku(getValue(row, FIELD_ALIASES.sku));
    const nombre = String(getValue(row, FIELD_ALIASES.nombre) ?? "").trim();
    const precio = parseMoney(getValue(row, FIELD_ALIASES.precio));
    if (!sku || !nombre || precio == null) continue;
    if (seen.has(sku)) continue;
    seen.add(sku);
    parsed.push({
      sku,
      nombre,
      codigo_fabricante: normalizeSku(getValue(row, FIELD_ALIASES.codigo_fabricante)) || null,
      precio_vta_sin_iva: parseMoney(getValue(row, FIELD_ALIASES.precio_vta_sin_iva)),
      precio,
    });
  }

  return parsed;
}
