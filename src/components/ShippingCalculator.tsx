import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Store, Truck } from "lucide-react";
import { calculateShipping, getLocalPickupOption, LOCAL_PICKUP_CODE } from "@/lib/shipping.functions";
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
  const canQuoteShipping = codigoPostal.trim().length >= 4;

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
    enabled: canQuoteShipping,
  });

  const shippingOptions = useMemo(
    () => opciones ?? [getLocalPickupOption()],
    [opciones],
  );

  useEffect(() => {
    setLocalSelected("");
    onShippingSelect?.(null);
  }, [codigoPostal, peso]);

  useEffect(() => {
    if (!localSelected && shippingOptions[0]) {
      setLocalSelected(shippingOptions[0].codigo_servicio);
      onShippingSelect?.(shippingOptions[0]);
    }
  }, [localSelected, onShippingSelect, shippingOptions]);

  if (isLoading) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg border border-border flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <p className="text-sm text-muted-foreground">Calculando opciones de envio...</p>
      </div>
    );
  }

  if (error) {
    console.error("Fallo el calculador de envío:", error); 
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Truck className="w-4 h-4" />
        Entrega
      </h3>
      {!canQuoteShipping && (
        <p className="text-xs text-muted-foreground">
          Ingresa un codigo postal para ver envios. Tambien podes retirar por el local.
        </p>
      )}
      <div className="space-y-2">
        {shippingOptions.map((opcion) => (
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
              <p className="font-medium text-sm flex items-center gap-2">
                {opcion.codigo_servicio === LOCAL_PICKUP_CODE && <Store className="size-3" />}
                {opcion.descripcion}
              </p>
              <p className="text-xs text-muted-foreground">
                {opcion.dias_habiles === 0 ? "Sin costo de envio" : `${opcion.dias_habiles} dias habiles`}
              </p>
            </div>
            <p className="font-semibold text-sm">{formatARS(opcion.precio)}</p>
          </label>
        ))}
      </div>
    </div>
  );
}
