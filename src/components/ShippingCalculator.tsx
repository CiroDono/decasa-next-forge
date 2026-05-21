import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Truck } from "lucide-react";
import { calculateShipping } from "@/lib/shipping.functions";
import type { ShippingOption } from "@/lib/shipping.functions";
import { formatARS } from "@/lib/format";

interface ShippingCalculatorProps {
  codigoPostal: string;
  peso?: number;
  largo?: number;
  ancho?: number;
  alto?: number;
  onShippingSelect?: (option: ShippingOption | null) => void;
  selectedShipping?: string;
}

export function ShippingCalculator({
  codigoPostal,
  peso = 1,
  largo = 0,
  ancho = 0,
  alto = 0,
  onShippingSelect,
  selectedShipping,
}: ShippingCalculatorProps) {
  const shippingFn = useServerFn(calculateShipping);
  const [localSelected, setLocalSelected] = useState<string>(selectedShipping || "");

  const { data: opciones, isLoading, error } = useQuery({
    queryKey: ["shipping", codigoPostal, peso],
    queryFn: () =>
      shippingFn({
        peso,
        destino_codigo_postal: codigoPostal,
        cantidad_bultos: 1,
        largo,
        ancho,
        alto,
      }),
    enabled: !!codigoPostal && codigoPostal.length >= 4,
  });

  useEffect(() => {
    setLocalSelected("");
    onShippingSelect?.(null);
  }, [codigoPostal, peso]);

  useEffect(() => {
    if (!localSelected && opciones?.[0]) {
      setLocalSelected(opciones[0].codigo_servicio);
      onShippingSelect?.(opciones[0]);
    }
  }, [localSelected, onShippingSelect, opciones]);

  if (!codigoPostal || codigoPostal.length < 4) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">Ingresa un código postal para calcular envío</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg border border-border flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <p className="text-sm text-muted-foreground">Calculando opciones de envío...</p>
      </div>
    );
  }

  if (error || !opciones || opciones.length === 0) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">No hay opciones de envío disponibles para esta zona</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Truck className="w-4 h-4" />
        Opciones de envío
      </h3>
      <div className="space-y-2">
        {opciones.map((opcion) => (
          <label
            key={opcion.codigo_servicio}
            className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition"
          >
            <input
              type="radio"
              name="shipping"
              value={opcion.codigo_servicio}
              checked={localSelected === opcion.codigo_servicio}
              onChange={(e) => {
                setLocalSelected(e.target.value);
                onShippingSelect?.(opcion);
              }}
              className="w-4 h-4"
            />
            <div className="flex-1">
              <p className="font-medium text-sm">{opcion.descripcion}</p>
              <p className="text-xs text-muted-foreground">{opcion.dias_habiles} días hábiles</p>
            </div>
            <p className="font-semibold text-sm">{formatARS(opcion.precio)}</p>
          </label>
        ))}
      </div>
    </div>
  );
}
