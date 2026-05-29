import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { calculateShipping } from "@/lib/shipping.functions";

export default function ShippingDemoPage() {
  const shippingFn = useServerFn(calculateShipping);
  const [codigoPostal, setCodigoPostal] = useState("1636");
  const [ciudad, setCiudad] = useState("Olivos");
  const [peso, setPeso] = useState("2");
  const [resultado, setResultado] = useState<any>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function calcular() {
    setCargando(true);
    setError("");
    try {
      const opciones = await shippingFn({
        data: {
          peso: parseFloat(peso),
          destino_codigo_postal: codigoPostal,
          destino_ciudad: ciudad,
        },
      });
      setResultado(opciones);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Demo - Calculador de Envío</h1>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Código Postal Destino</label>
            <input
              type="text"
              value={codigoPostal}
              onChange={(e) => setCodigoPostal(e.target.value)}
              placeholder="Ej: 1636"
              className="w-full border border-border rounded px-3 py-2 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ciudad Destino</label>
            <input
              type="text"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Ej: Olivos"
              className="w-full border border-border rounded px-3 py-2 outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Peso (kg)</label>
            <input
              type="number"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="Ej: 2"
              className="w-full border border-border rounded px-3 py-2 outline-none focus:border-primary"
              step="0.1"
              min="0"
            />
          </div>

          <button
            onClick={calcular}
            disabled={cargando}
            className="w-full bg-primary text-primary-foreground py-2 rounded font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {cargando ? "Calculando..." : "Calcular Envío"}
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded p-4 mb-6 text-destructive">
            <strong>Error:</strong> {error}
          </div>
        )}

        {resultado && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Opciones disponibles:</h2>
            {resultado.map((opcion: any, idx: number) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{opcion.descripcion}</h3>
                    <p className="text-sm text-muted-foreground">{opcion.dias_habiles} días hábiles</p>
                    <p className="text-xs text-muted-foreground mt-1">Código: {opcion.codigo_servicio}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${opcion.precio.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!resultado && !error && !cargando && (
          <div className="bg-muted/30 border border-border rounded p-6 text-center text-muted-foreground">
            Ingresa los datos y haz clic en "Calcular Envío" para ver las opciones disponibles
          </div>
        )}
      </div>
    </div>
  );
}
