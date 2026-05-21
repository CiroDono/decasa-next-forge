import { server$ } from "@tanstack/react-start/server";

/**
 * Calcula el costo de envío con Correo Argentino
 * Documentación: https://www.correoargentino.com.ar/
 */

interface ShippingParams {
  peso: number; // en kg
  destino_codigo_postal: string;
  origen_codigo_postal?: string; // Por defecto será el de la empresa
  cantidad_bultos?: number;
  largo?: number;
  ancho?: number;
  alto?: number;
}

interface ShippingOption {
  servicio: string;
  descripcion: string;
  dias_habiles: number;
  precio: number;
  codigo_servicio: string;
}

export const calculateShipping = server$(async (
  params: ShippingParams
): Promise<ShippingOption[]> => {
  try {
    // Correo Argentino API - Cotización de envíos
    // Usamos las credenciales del archivo .env
    const username = process.env.CORREO_ARGENTINO_USERNAME || "";
    const password = process.env.CORREO_ARGENTINO_PASSWORD || "";
    const apiKey = process.env.CORREO_ARGENTINO_API_KEY || "";

    if (!username || !password) {
      console.error("Credenciales de Correo Argentino no configuradas");
      // Retornar opciones por defecto
      return getDefaultShippingOptions(params.peso);
    }

    const origen_cp = params.origen_codigo_postal || "1636"; // Código postal por defecto (Boca)

    // URL de la API de Correo Argentino
    const url = "https://api.correoargentino.com.ar/cv/v1.0/cotizador";

    const payload = {
      solicitante: {
        usuario: username,
        contraseña: password,
      },
      operacion: "VerificarCotizador",
      parametros: {
        envia: {
          codigoPostal: origen_cp,
          idProvincia: 1, // Provincia por defecto
        },
        recibe: {
          codigoPostal: params.destino_codigo_postal,
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Error de Correo Argentino:", response.statusText);
      return getDefaultShippingOptions(params.peso);
    }

    const data = await response.json();

    // Procesar respuesta de Correo Argentino
    if (data.statusCode !== "200" || !data.resultado) {
      console.error("Respuesta inválida de Correo Argentino:", data);
      return getDefaultShippingOptions(params.peso);
    }

    // Mapear servicios disponibles
    const servicios = data.resultado.serviciosDisponibles || [];

    return servicios.map((s: any) => ({
      servicio: s.producto,
      descripcion: s.descripcionProducto || s.producto,
      dias_habiles: s.plazoEntrega || 3,
      precio: s.monto || calculateDefaultPrice(params.peso),
      codigo_servicio: s.idProducto || s.producto,
    }));
  } catch (error) {
    console.error("Error al calcular envío:", error);
    return getDefaultShippingOptions(params.peso);
  }
});

/**
 * Opciones por defecto si la API no está disponible
 */
function getDefaultShippingOptions(peso: number): ShippingOption[] {
  return [
    {
      servicio: "Estándar",
      descripcion: "Envío estándar (5-7 días hábiles)",
      dias_habiles: 6,
      precio: calculateDefaultPrice(peso),
      codigo_servicio: "estandar",
    },
    {
      servicio: "Rápido",
      descripcion: "Envío rápido (2-3 días hábiles)",
      dias_habiles: 3,
      precio: calculateDefaultPrice(peso) * 1.5,
      codigo_servicio: "rapido",
    },
    {
      servicio: "Express",
      descripcion: "Envío express (24 horas)",
      dias_habiles: 1,
      precio: calculateDefaultPrice(peso) * 2.5,
      codigo_servicio: "express",
    },
  ];
}

/**
 * Calcula precio por defecto basado en peso
 */
function calculateDefaultPrice(peso: number): number {
  // Precio base: $500 + $50 por kg
  const base = 500;
  const porKg = 50;
  return base + peso * porKg;
}

/**
 * Obtiene las provincias de Argentina para validación
 */
export const getProvincias = server$(async (): Promise<
  { codigo: string; nombre: string; codigo_postal_inicio: number }[]
> => {
  return [
    { codigo: "01", nombre: "Buenos Aires", codigo_postal_inicio: 1600 },
    { codigo: "02", nombre: "Catamarca", codigo_postal_inicio: 4700 },
    { codigo: "03", nombre: "Córdoba", codigo_postal_inicio: 5000 },
    { codigo: "04", nombre: "Corrientes", codigo_postal_inicio: 3400 },
    { codigo: "05", nombre: "Entre Ríos", codigo_postal_inicio: 3100 },
    { codigo: "06", nombre: "Formosa", codigo_postal_inicio: 3600 },
    { codigo: "07", nombre: "Jujuy", codigo_postal_inicio: 4600 },
    { codigo: "08", nombre: "La Pampa", codigo_postal_inicio: 6300 },
    { codigo: "09", nombre: "La Rioja", codigo_postal_inicio: 5300 },
    { codigo: "10", nombre: "Mendoza", codigo_postal_inicio: 5500 },
    { codigo: "11", nombre: "Misiones", codigo_postal_inicio: 3300 },
    { codigo: "12", nombre: "Neuquén", codigo_postal_inicio: 8300 },
    { codigo: "13", nombre: "Río Negro", codigo_postal_inicio: 8400 },
    { codigo: "14", nombre: "Salta", codigo_postal_inicio: 4400 },
    { codigo: "15", nombre: "San Juan", codigo_postal_inicio: 5400 },
    { codigo: "16", nombre: "San Luis", codigo_postal_inicio: 5700 },
    { codigo: "17", nombre: "Santa Cruz", codigo_postal_inicio: 9400 },
    { codigo: "18", nombre: "Santa Fe", codigo_postal_inicio: 3000 },
    { codigo: "19", nombre: "Santiago del Estero", codigo_postal_inicio: 4200 },
    { codigo: "20", nombre: "Tierra del Fuego", codigo_postal_inicio: 9410 },
    { codigo: "21", nombre: "Tucumán", codigo_postal_inicio: 4000 },
  ];
});
