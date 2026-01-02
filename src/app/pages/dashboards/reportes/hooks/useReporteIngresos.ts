import { useState, useEffect, useCallback } from "react";
import axios from "@/utils/axios";

export interface VentaReporteItem {
  producto_id: number;
  producto: string;
  tipo_convenio_id: number | null;
  tipo_convenio: string | null;
  total_vendidos: number;
  total_padron: string | number;
  total_fuera_padron: string | number;
}

export interface DetalleProducto {
  producto: string;
  cantidad: number;
  monto: number;
}

export interface ReporteGroup {
  convenio: string;
  detalles: DetalleProducto[];
  totalCantidad: number;
  totalMonto: number;
}

interface UseReporteIngresosReturn {
  reporteGroups: ReporteGroup[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const PRECIO_CONVENIO = 0;
const PRECIO_CONVENIO_EMPLEADOS = 4000;
const PRECIO_SIN_CONVENIO = 5000;

export function useReporteIngresos(
  fechaDesde: string | null,
  fechaHasta: string | null
): UseReporteIngresosReturn {
  const [reporteGroups, setReporteGroups] = useState<ReporteGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReporte = useCallback(async () => {
    if (!fechaDesde || !fechaHasta) {
      setReporteGroups([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<VentaReporteItem[]>(
        `/api/ventas/reporte`,
        {
          params: {
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta,
          },
        }
      );

      // Agrupación: Map<NombreConvenio, Map<NombreProducto, {cantidad, monto}>>
      const groupsMap = new Map<string, Map<string, { cantidad: number; monto: number }>>();

      const addToGroup = (convenio: string, producto: string, cantidad: number, monto: number) => {
        if (!groupsMap.has(convenio)) {
          groupsMap.set(convenio, new Map());
        }
        const productosMap = groupsMap.get(convenio)!;
        const current = productosMap.get(producto) || { cantidad: 0, monto: 0 };
        productosMap.set(producto, {
          cantidad: current.cantidad + cantidad,
          monto: current.monto + monto
        });
      };

      response.data.forEach((item) => {
        const producto = item.producto;
        const nombreConvenio = item.tipo_convenio;
        const totalPadron = parseInt(String(item.total_padron)) || 0;
        const totalFueraPadron = parseInt(String(item.total_fuera_padron)) || 0;

        // 1. Procesar "Sin Convenio" (fuera_padron)
        if (totalFueraPadron > 0) {
          let precio = PRECIO_SIN_CONVENIO;
          if (producto.toLowerCase().includes("menor")) {
            precio = 0;
          }
          addToGroup(
            "Sin Convenio",
            producto,
            totalFueraPadron,
            totalFueraPadron * precio
          );
        }

        // 2. Procesar con Convenio (padron)
        if (totalPadron > 0 && nombreConvenio) {
          let precio = PRECIO_CONVENIO;
          if (nombreConvenio.toLowerCase().includes("empleado cec")) {
            precio = PRECIO_CONVENIO_EMPLEADOS;
          }
          if (producto.toLowerCase().includes("menor")) {
            precio = 0;
          }
          addToGroup(
            nombreConvenio,
            producto,
            totalPadron,
            totalPadron * precio
          );
        }
      });

      // Convertir Map a Array de ReporteGroup
      const result: ReporteGroup[] = Array.from(groupsMap.entries()).map(([convenio, productosMap]) => {
        const detalles = Array.from(productosMap.entries()).map(([producto, data]) => ({
          producto,
          cantidad: data.cantidad,
          monto: data.monto
        }));

        return {
          convenio,
          detalles,
          totalCantidad: detalles.reduce((sum, d) => sum + d.cantidad, 0),
          totalMonto: detalles.reduce((sum, d) => sum + d.monto, 0)
        };
      }).sort((a, b) => {
        // "Sin Convenio" al final
        if (a.convenio === "Sin Convenio") return 1;
        if (b.convenio === "Sin Convenio") return -1;
        return a.convenio.localeCompare(b.convenio);
      });

      setReporteGroups(result);
    } catch (err: any) {
      console.error("Error al obtener reporte de ingresos:", err);
      setError(err?.message || "Error al obtener reporte de ingresos");
      setReporteGroups([]);
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta]);

  useEffect(() => {
    fetchReporte();
  }, [fetchReporte]);

  // Wrapper para compatibilidad si fuera necesario, pero mejor retornamos la nueva estructura
  return {
    reporteGroups,
    loading,
    error,
    refetch: fetchReporte,
  };
}
