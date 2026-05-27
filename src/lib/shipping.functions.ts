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
      quoteCorreoArgentinoShipping(params),
      getCorreoArgentinoPickupBranches(params.destino_codigo_postal),
    ]);
    const branchOptions = buildPickupBranchOptions(pickupBranches, homeOptions);
    return [getLocalPickupOption(), ...branchOptions, ...homeOptions];
  });

export async function quoteCorreoArgentinoShipping(params: ShippingQuoteParams): Promise<ShippingOption[]> {
  try {
    const username = process.env.CORREO_ARGENTINO_USERNAME || "";
    const password = process.env.CORREO_ARGENTINO_PASSWORD || "";

    if (!username || !password) {
      console.warn("[shipping] Correo Argentino credentials missing. Using fallback rates.");
      return getDefaultShippingOptions(params.peso);
    }

    const origenCp = params.origen_codigo_postal || process.env.SHIPPING_ORIGIN_CP || "5172";
    const url = process.env.CORREO_ARGENTINO_QUOTE_URL || "https://api.correoargentino.com.ar/cv/v1.0/cotizador";

    console.info("[shipping] quoting Correo Argentino", {
      origenCp,
      destinoCp: params.destino_codigo_postal,
      peso: params.peso,
      cantidadBultos: params.cantidad_bultos ?? 1,
    });

    const payload = {
      solicitante: {
        usuario: username,
        contrasena: password,
      },
      operacion: "VerificarCotizador",
      parametros: {
        envia: {
          codigoPostal: origenCp,
          idProvincia: 3,
        },
        recibe: {
          codigoPostal: params.destino_codigo_postal.replace(/\D/g, '').substring(0, 4) || params.destino_codigo_postal,
        },
        envios: [
          {
            cantidad: params.cantidad_bultos || 1,
            peso: params.peso,
            volumen: (params.largo || 0) * (params.ancho || 0) * (params.alto || 0),
          },
        ],
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("[shipping] Correo Argentino quote failed", {
        status: response.status,
        statusText: response.statusText,
      });
      return getDefaultShippingOptions(params.peso);
    }

    const data = await response.json();
    const servicios = data?.resultado?.serviciosDisponibles ?? data?.serviciosDisponibles ?? [];

    if (!Array.isArray(servicios) || servicios.length === 0) {
      console.error("[shipping] Correo Argentino returned no services", { statusCode: data?.statusCode });
      return getDefaultShippingOptions(params.peso);
    }

    return servicios.map((s: any) => {
      const precio = Number(s.monto ?? s.precio ?? s.importe ?? calculateDefaultPrice(params.peso));
      return {
        servicio: String(s.producto ?? s.servicio ?? "Correo Argentino"),
        descripcion: String(s.descripcionProducto ?? s.descripcion ?? s.producto ?? "Envio Correo Argentino"),
        dias_habiles: Number(s.plazoEntrega ?? s.dias_habiles ?? 5),
        precio: roundMoney(precio),
        codigo_servicio: String(s.idProducto ?? s.codigo_servicio ?? s.producto ?? "correo-argentino"),
        tipo: "domicilio",
      };
    });
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

  if (codigoServicio.startsWith("correo-sucursal:")) {
    const [homeOptions, pickupBranches] = await Promise.all([
      quoteCorreoArgentinoShipping(params),
      getCorreoArgentinoPickupBranches(params.destino_codigo_postal),
    ]);
    const selected = buildPickupBranchOptions(pickupBranches, homeOptions).find(
      (option) => option.codigo_servicio === codigoServicio,
    );
    if (!selected) {
      throw new Error("La sucursal seleccionada ya no esta disponible");
    }
    return selected;
  }

  const options = await quoteCorreoArgentinoShipping(params);
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

async function getCorreoArgentinoPickupBranches(codigoPostal: string): Promise<PickupBranch[]> {
  const apiKey = process.env.CORREO_ARGENTINO_API_KEY || process.env.CORREO_ARGENTINO_AGENCIES_API_KEY || "";
  const agreement = process.env.CORREO_ARGENTINO_AGREEMENT || "";
  const baseUrl = process.env.CORREO_ARGENTINO_AGENCIES_URL || "https://api.correoargentino.com.ar/paqar/v1/agencies";

  if (!apiKey || !agreement) {
    console.warn("[shipping] Correo Argentino agencies credentials missing. Skipping pickup branches.");
    return [];
  }

  try {
    const cp = codigoPostal.replace(/\D/g, "").substring(0, 4);
    const url = new URL(baseUrl);
    url.searchParams.set("postal_code", cp);
    url.searchParams.set("postalCode", cp);
    url.searchParams.set("zipCode", cp);
    url.searchParams.set("pickup_availability", "true");
    url.searchParams.set("package_reception", "true");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Apikey ${apiKey}`,
        agreement,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("[shipping] Correo Argentino agencies failed", {
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
    servicio: "Retiro en sucursal Correo Argentino",
    descripcion: `Retiro en sucursal - ${branch.nombre}`,
    dias_habiles: days,
    precio: price,
    codigo_servicio: `correo-sucursal:${branch.id}`,
    tipo: "sucursal" as const,
    sucursal: branch,
  }));
}

function normalizePickupBranch(raw: any): PickupBranch | null {
  const id = String(raw.id ?? raw.code ?? raw.codigo ?? raw.agency_id ?? raw.sucursalId ?? "").trim();
  const nombre = String(raw.name ?? raw.nombre ?? raw.description ?? raw.descripcion ?? "Sucursal Correo Argentino").trim();
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
      servicio: "Estandar",
      descripcion: "Envio estandar (5-7 dias habiles)",
      dias_habiles: 6,
      precio: calculateDefaultPrice(peso),
      codigo_servicio: "estandar",
      tipo: "domicilio",
    },
    {
      servicio: "Rapido",
      descripcion: "Envio rapido (2-3 dias habiles)",
      dias_habiles: 3,
      precio: roundMoney(calculateDefaultPrice(peso) * 1.5),
      codigo_servicio: "rapido",
      tipo: "domicilio",
    },
    {
      servicio: "Express",
      descripcion: "Envio express (24 horas)",
      dias_habiles: 1,
      precio: roundMoney(calculateDefaultPrice(peso) * 2.5),
      codigo_servicio: "express",
      tipo: "domicilio",
    },
  ];
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
