import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface ShippingOption {
  servicio: string;
  descripcion: string;
  dias_habiles: number;
  precio: number;
  codigo_servicio: string;
  tipo?: "local" | "domicilio" | "sucursal";
  sucursal?: PickupBranch;
}

export interface PickupBranch {
  id: string;
  nombre: string;
  direccion: string;
  localidad?: string;
  provincia?: string;
  codigo_postal?: string;
  horario?: string;
}

export const LOCAL_PICKUP_CODE = "retiro-local";

const shippingParamsSchema = z.object({
  peso: z.number().positive().max(500),
  destino_codigo_postal: z.string().trim().min(4, "Codigo postal invalido"), 
  destino_ciudad: z.string().trim().min(1).optional(),
  origen_codigo_postal: z.string().trim().min(4).optional(),
  cantidad_bultos: z.number().int().positive().optional(),
  largo: z.number().nonnegative().optional(),
  ancho: z.number().nonnegative().optional(),
  alto: z.number().nonnegative().optional(),
});

export type ShippingQuoteParams = z.infer<typeof shippingParamsSchema>;

export const calculateShipping = createServerFn({ method: "POST" })
  .inputValidator((d) => shippingParamsSchema.parse(d))
  .handler(async ({ data: params }): Promise<ShippingOption[]> => {
    const [homeOptions, pickupBranches] = await Promise.all([
      quoteAndreaniShipping(params),
      getAndreaniPickupBranches(params.destino_codigo_postal),
    ]);
    const branchOptions = buildPickupBranchOptions(pickupBranches, homeOptions);
    return [getLocalPickupOption(), ...branchOptions, ...homeOptions];
  });

export async function quoteAndreaniShipping(params: ShippingQuoteParams): Promise<ShippingOption[]> {
  try {
    const username = process.env.ANDREANI_USERNAME || "";
    const password = process.env.ANDREANI_PASSWORD || "";
    const contrato = process.env.ANDREANI_CONTRACT || "";
    const cliente = process.env.ANDREANI_CLIENT || "";

    if (!username || !password || !contrato || !cliente) {
      console.warn("[shipping] Andreani credentials missing. Using fallback rates.");
      return getDefaultShippingOptions(params.peso);
    }

    const origenCp = params.origen_codigo_postal || process.env.SHIPPING_ORIGIN_CP || "5172";
    const token = await getAndreaniToken(username, password);
    const baseUrl = process.env.ANDREANI_QUOTE_URL || "https://apis.andreanigloballpack.com/cotizador-globallpack/api/v1/Cotizador";
    const url = new URL(baseUrl);
    const destinationCp = normalizePostalCode(params.destino_codigo_postal);
    const originCity = process.env.SHIPPING_ORIGIN_CITY || "La Falda";
    const destinationCity = params.destino_ciudad || process.env.ANDREANI_DESTINATION_CITY || destinationCp;
    const length = params.largo || Number(process.env.SHIPPING_DEFAULT_LENGTH_CM ?? 20);
    const width = params.ancho || Number(process.env.SHIPPING_DEFAULT_WIDTH_CM ?? 20);
    const height = params.alto || Number(process.env.SHIPPING_DEFAULT_HEIGHT_CM ?? 10);
    const volumen = length * width * height;

    url.searchParams.set("CpDestino", destinationCp);
    url.searchParams.set("CiudadDestino", destinationCity);
    url.searchParams.set("PaisDestino", "AR");
    url.searchParams.set("CpOrigen", normalizePostalCode(origenCp));
    url.searchParams.set("CiudadOrigen", originCity);
    url.searchParams.set("PaisOrigen", "AR");
    url.searchParams.set("Contrato", contrato);
    url.searchParams.set("Cliente", cliente);
    url.searchParams.set("bultos[0].valorDeclarado", process.env.SHIPPING_DECLARED_VALUE || "1000");
    url.searchParams.set("bultos[0].volumen", String(volumen));
    url.searchParams.set("bultos[0].kilos", String(params.peso));
    url.searchParams.set("bultos[0].altoCm", String(height));
    url.searchParams.set("bultos[0].largoCm", String(length));
    url.searchParams.set("bultos[0].anchoCm", String(width));
    url.searchParams.set("bultos[0].categoriaProducto", process.env.ANDREANI_PRODUCT_CATEGORY || "Herramientas y equipamiento");

    console.info("[shipping] quoting Andreani", {
      origenCp,
      destinoCp: params.destino_codigo_postal,
      peso: params.peso,
      cantidadBultos: params.cantidad_bultos ?? 1,
    });

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-authorization-token": token,
      },
    });

    if (!response.ok) {
      console.error("[shipping] Andreani quote failed", {
        status: response.status,
        statusText: response.statusText,
      });
      return getDefaultShippingOptions(params.peso);
    }

    const data = await response.json();
    const total = Number(data?.tarifaConIva?.total ?? data?.UltimaMilla ?? data?.total ?? data?.importe);

    if (!Number.isFinite(total) || total <= 0) {
      console.error("[shipping] Andreani returned no price", data);
      return getDefaultShippingOptions(params.peso);
    }

    return [
      {
        servicio: "Andreani",
        descripcion: "Envio Andreani a domicilio",
        dias_habiles: Number(process.env.ANDREANI_DEFAULT_DELIVERY_DAYS ?? 5),
        precio: roundMoney(total),
        codigo_servicio: "andreani-domicilio",
        tipo: "domicilio",
      },
    ];
  } catch (error) {
    console.error("[shipping] quote error", error);
    return getDefaultShippingOptions(params.peso);
  }
}

export async function selectShippingOption(
  params: ShippingQuoteParams,
  codigoServicio: string,
): Promise<ShippingOption> {
  if (codigoServicio === LOCAL_PICKUP_CODE) {
    console.info("[shipping] local pickup selected");
    return getLocalPickupOption();
  }

  if (codigoServicio.startsWith("andreani-sucursal:")) {
    const [homeOptions, pickupBranches] = await Promise.all([
      quoteAndreaniShipping(params),
      getAndreaniPickupBranches(params.destino_codigo_postal),
    ]);
    const selected = buildPickupBranchOptions(pickupBranches, homeOptions).find(
      (option) => option.codigo_servicio === codigoServicio,
    );
    if (!selected) {
      throw new Error("La sucursal seleccionada ya no esta disponible");
    }
    return selected;
  }

  const options = await quoteAndreaniShipping(params);
  const selected = options.find((option) => option.codigo_servicio === codigoServicio);
  if (!selected) {
    console.warn("[shipping] selected service is not available", {
      codigoServicio,
      destinoCp: params.destino_codigo_postal,
      available: options.map((option) => option.codigo_servicio),
    });
    throw new Error("La opcion de envio seleccionada ya no esta disponible");
  }
  return selected;
}

export function getLocalPickupOption(): ShippingOption {
  return {
    servicio: "Retiro en local",
    descripcion: "Retiro por el local - Av. Pres. Kennedy 270, La Falda",
    dias_habiles: 0,
    precio: 0,
    codigo_servicio: LOCAL_PICKUP_CODE,
    tipo: "local",
  };
}

async function getAndreaniPickupBranches(codigoPostal: string): Promise<PickupBranch[]> {
  const baseUrl = process.env.ANDREANI_BRANCHES_URL || "";

  if (!baseUrl) {
    console.warn("[shipping] Andreani branches URL missing. Skipping pickup branches.");
    return [];
  }

  try {
    const cp = normalizePostalCode(codigoPostal);
    const url = new URL(baseUrl);
    url.searchParams.set("postal_code", cp);
    url.searchParams.set("postalCode", cp);
    url.searchParams.set("zipCode", cp);

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error("[shipping] Andreani branches failed", {
        status: response.status,
        statusText: response.statusText,
      });
      return [];
    }

    const data = await response.json();
    const rawBranches = data?.agencies ?? data?.sucursales ?? data?.resultado ?? data?.data ?? data;
    if (!Array.isArray(rawBranches)) return [];

    return rawBranches.map(normalizePickupBranch).filter((branch): branch is PickupBranch => Boolean(branch));
  } catch (error) {
    console.error("[shipping] agencies lookup error", error);
    return [];
  }
}

function buildPickupBranchOptions(branches: PickupBranch[], homeOptions: ShippingOption[]): ShippingOption[] {
  const reference = homeOptions.find((option) => option.precio > 0) ?? homeOptions[0];
  const price = reference ? reference.precio : 0;
  const days = reference ? reference.dias_habiles : 5;

  return branches.slice(0, 5).map((branch) => ({
    servicio: "Retiro en sucursal Andreani",
    descripcion: `Retiro en sucursal - ${branch.nombre}`,
    dias_habiles: days,
    precio: price,
    codigo_servicio: `andreani-sucursal:${branch.id}`,
    tipo: "sucursal" as const,
    sucursal: branch,
  }));
}

function normalizePickupBranch(raw: any): PickupBranch | null {
  const id = String(raw.id ?? raw.code ?? raw.codigo ?? raw.agency_id ?? raw.sucursalId ?? "").trim();
  const nombre = String(raw.name ?? raw.nombre ?? raw.description ?? raw.descripcion ?? "Sucursal Andreani").trim();
  const street = raw.address ?? raw.direccion ?? raw.street ?? raw.calle;
  const number = raw.number ?? raw.numero;
  const direccion = [street, number].filter(Boolean).join(" ").trim();

  if (!id || !direccion) return null;

  return {
    id,
    nombre,
    direccion,
    localidad: raw.city ?? raw.localidad ?? raw.town ?? undefined,
    provincia: raw.state ?? raw.provincia ?? raw.province ?? undefined,
    codigo_postal: raw.postal_code ?? raw.codigo_postal ?? raw.zipCode ?? undefined,
    horario: raw.business_hours ?? raw.horario ?? raw.opening_hours ?? undefined,
  };
}

function getDefaultShippingOptions(peso: number): ShippingOption[] {
  return [
    {
      servicio: "Andreani estandar",
      descripcion: "Envio Andreani estandar (5-7 dias habiles)",
      dias_habiles: 6,
      precio: calculateDefaultPrice(peso),
      codigo_servicio: "andreani-estandar",
      tipo: "domicilio",
    },
    {
      servicio: "Andreani rapido",
      descripcion: "Envio Andreani rapido (2-3 dias habiles)",
      dias_habiles: 3,
      precio: roundMoney(calculateDefaultPrice(peso) * 1.5),
      codigo_servicio: "andreani-rapido",
      tipo: "domicilio",
    },
  ];
}

async function getAndreaniToken(username: string, password: string): Promise<string> {
  const loginUrl = process.env.ANDREANI_LOGIN_URL || "https://apis.andreani.com/login";
  const credentials = Buffer.from(`${username}:${password}`).toString("base64");
  const response = await fetch(loginUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Andreani login failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const token = data?.token ?? data?.access_token ?? data?.bearerToken;
  if (!token) {
    throw new Error("Andreani login did not return a token");
  }
  return String(token);
}

function normalizePostalCode(value: string): string {
  return value.replace(/\D/g, "").substring(0, 4) || value;
}

function calculateDefaultPrice(peso: number): number {
  const base = Number(process.env.SHIPPING_FALLBACK_BASE ?? 500);
  const porKg = Number(process.env.SHIPPING_FALLBACK_PER_KG ?? 50);
  return roundMoney(base + peso * porKg);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export const getProvincias = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ codigo: string; nombre: string; codigo_postal_inicio: number }[]> => {
    return [
      { codigo: "01", nombre: "Buenos Aires", codigo_postal_inicio: 1600 },
      { codigo: "02", nombre: "Catamarca", codigo_postal_inicio: 4700 },
      { codigo: "03", nombre: "Cordoba", codigo_postal_inicio: 5000 },
      { codigo: "04", nombre: "Corrientes", codigo_postal_inicio: 3400 },
      { codigo: "05", nombre: "Entre Rios", codigo_postal_inicio: 3100 },
      { codigo: "06", nombre: "Formosa", codigo_postal_inicio: 3600 },
      { codigo: "07", nombre: "Jujuy", codigo_postal_inicio: 4600 },
      { codigo: "08", nombre: "La Pampa", codigo_postal_inicio: 6300 },
      { codigo: "09", nombre: "La Rioja", codigo_postal_inicio: 5300 },
      { codigo: "10", nombre: "Mendoza", codigo_postal_inicio: 5500 },
      { codigo: "11", nombre: "Misiones", codigo_postal_inicio: 3300 },
      { codigo: "12", nombre: "Neuquen", codigo_postal_inicio: 8300 },
      { codigo: "13", nombre: "Rio Negro", codigo_postal_inicio: 8400 },
      { codigo: "14", nombre: "Salta", codigo_postal_inicio: 4400 },
      { codigo: "15", nombre: "San Juan", codigo_postal_inicio: 5400 },
      { codigo: "16", nombre: "San Luis", codigo_postal_inicio: 5700 },
      { codigo: "17", nombre: "Santa Cruz", codigo_postal_inicio: 9400 },
      { codigo: "18", nombre: "Santa Fe", codigo_postal_inicio: 3000 },
      { codigo: "19", nombre: "Santiago del Estero", codigo_postal_inicio: 4200 },
      { codigo: "20", nombre: "Tierra del Fuego", codigo_postal_inicio: 9410 },
      { codigo: "21", nombre: "Tucuman", codigo_postal_inicio: 4000 },
    ];
  },
);
