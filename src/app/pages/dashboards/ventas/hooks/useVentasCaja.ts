import { useState, useEffect, useCallback } from "react";
import axios from "@/utils/axios";

export interface VentaCajaResponse {
  id: number;
  monto_total: string;
  medio_pago_id: number;
  cliente_id: string;
  usuario_vendedor_id: number;
  punto_venta_id: number;
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
      afiliado: {
        id: string;
        persona_id: string;
        tipo_convenio_id: number;
        tipo_convenio: {
          id: number;
          nombre: string;
        };
      } | null;
    };
  };
}

export interface VentaCaja {
  id: number;
  montoTotal: number;
  clienteNombre: string;
  clienteApellido: string;
  totalEntradas: number;
  convenioNombre: string;
  createdAt: string;
  estadoNombre: string;
}

// Sistema de invalidación global para refrescar todos los hooks cuando hay un cambio
const invalidationListeners: Map<number | null, Set<() => void>> = new Map();

export function invalidateVentasCaja(cajaId: number | null) {
  const listeners = invalidationListeners.get(cajaId);
  if (listeners) {
    listeners.forEach((refetch) => refetch());
  }
}

interface UseVentasCajaReturn {
  ventas: VentaCaja[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVentasCaja(
  cajaId: number | null
): UseVentasCajaReturn {
  const [ventas, setVentas] = useState<VentaCaja[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVentas = useCallback(async () => {
    if (!cajaId) {
      setVentas([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<VentaCajaResponse[]>(
        `/api/ventas`,
        {
          params: {
            caja_id: cajaId,
          },
        }
      );

      // Procesar ventas
      const processedVentas: VentaCaja[] = response.data.map((v) => {
        const montoTotal = parseFloat(v.monto_total);
        const totalEntradas = v.total_detalles_convenio + v.total_detalles_sin_convenio;
        // Usar la misma lógica que en useCajaActions: tipo_convenio de la venta, o "Sin Convenio" si es null
        const convenioNombre = v.tipo_convenio?.nombre || "Sin Convenio";
        const estadoNombre = v.estado?.nombre || "";

        return {
          id: v.id,
          montoTotal,
          clienteNombre: v.cliente.persona.nombre,
          clienteApellido: v.cliente.persona.apellido,
          totalEntradas,
          convenioNombre,
          createdAt: v.created_at,
          estadoNombre,
        };
      });

      // Ordenar ventas de más nuevas a más viejas
      const sortedVentas = processedVentas.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      setVentas(sortedVentas);
    } catch (err: any) {
      console.error("Error al obtener ventas:", err);
      setError(err?.message || "Error al obtener ventas");
      setVentas([]);
    } finally {
      setLoading(false);
    }
  }, [cajaId]);

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  // Registrar el listener para invalidación
  useEffect(() => {
    if (!invalidationListeners.has(cajaId)) {
      invalidationListeners.set(cajaId, new Set());
    }
    const listeners = invalidationListeners.get(cajaId)!;
    listeners.add(fetchVentas);

    return () => {
      listeners.delete(fetchVentas);
      if (listeners.size === 0) {
        invalidationListeners.delete(cajaId);
      }
    };
  }, [cajaId, fetchVentas]);

  return {
    ventas,
    loading,
    error,
    refetch: fetchVentas,
  };
}


