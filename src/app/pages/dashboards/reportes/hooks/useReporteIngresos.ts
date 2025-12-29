import { useState, useEffect, useCallback } from "react";
import axios from "@/utils/axios";

export interface VentaReporteResponse {
  id: number;
  monto_total: string;
  medio_pago_id: number;
  cliente_id: string;
  usuario_vendedor_id: number;
  punto_venta_id: number;
  estado_venta_id: number;
  tipo_convenio_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  total_detalles_convenio: number;
  total_detalles_sin_convenio: number;
  tipo_convenio: {
    id: number;
    nombre: string;
  } | null;
  estado: {
    id: number;
    nombre: string;
  };
  cliente: {
    id: string;
    persona_id: string;
    persona: {
      id: string;
      nombre: string;
      apellido: string;
    };
  };
}

export interface IngresoPorConvenio {
  convenio: string;
  cantidad: number;
}

interface UseReporteIngresosReturn {
  ingresosPorConvenio: IngresoPorConvenio[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useReporteIngresos(
  fechaDesde: string | null,
  fechaHasta: string | null
): UseReporteIngresosReturn {
  const [ingresosPorConvenio, setIngresosPorConvenio] = useState<IngresoPorConvenio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReporte = useCallback(async () => {
    if (!fechaDesde || !fechaHasta) {
      setIngresosPorConvenio([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<VentaReporteResponse[]>(
        `/api/ventas`,
        {
          params: {
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta,
          },
        }
      );

      // Agrupar por convenio (similar a useCajaActions)
      const personasPorConvenioMap = new Map<string, number>();

      response.data
        .filter((venta) => venta.estado?.nombre !== "Cancelada")
        .forEach((venta) => {
          // Procesar total_detalles_convenio
          const cantidadConvenio = parseInt(venta.total_detalles_convenio.toString()) || 0;
          if (cantidadConvenio > 0) {
            const nombreConvenio = venta.tipo_convenio?.nombre || "Sin Convenio";
            const current = personasPorConvenioMap.get(nombreConvenio) || 0;
            personasPorConvenioMap.set(nombreConvenio, current + cantidadConvenio);
          }

          // Procesar total_detalles_sin_convenio -> sumar a "No Afiliados"
          const cantidadSinConvenio = parseInt(venta.total_detalles_sin_convenio.toString()) || 0;
          if (cantidadSinConvenio > 0) {
            const current = personasPorConvenioMap.get("No Afiliados") || 0;
            personasPorConvenioMap.set("No Afiliados", current + cantidadSinConvenio);
          }
        });

      // Convertir a array y ordenar (No Afiliados al final)
      const ingresos = Array.from(personasPorConvenioMap.entries())
        .map(([convenio, cantidad]) => ({
          convenio,
          cantidad,
        }))
        .sort((a, b) => {
          if (a.convenio === "No Afiliados") return 1;
          if (b.convenio === "No Afiliados") return -1;
          return a.convenio.localeCompare(b.convenio);
        });

      setIngresosPorConvenio(ingresos);
    } catch (err: any) {
      console.error("Error al obtener reporte de ingresos:", err);
      setError(err?.message || "Error al obtener reporte de ingresos");
      setIngresosPorConvenio([]);
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta]);

  useEffect(() => {
    fetchReporte();
  }, [fetchReporte]);

  return {
    ingresosPorConvenio,
    loading,
    error,
    refetch: fetchReporte,
  };
}

