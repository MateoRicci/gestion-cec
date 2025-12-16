import { useState, useEffect, useCallback } from "react";
import axios from "@/utils/axios";

export interface MovimientoCajaResponse {
  id: number;
  caja_id: number;
  tipo_movimiento_caja_id: number;
  usuario_id: number;
  monto: string; // Viene como string desde el backend
  descripcion: string | null;
  accion_movimiento_type: string | null;
  accion_movimiento_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Relación opcional con el tipo de movimiento, cuando el backend lo incluye
  tipo_movimiento_caja?: {
    id: number;
    nombre: string;
    descripcion: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  } | null;
}

export interface MovimientoCaja {
  id: number;
  monto: number; // Los egresos vienen con signo negativo
  tipoMovimientoCajaId: number;
  tipoMovimientoNombre: string;
  descripcion: string;
  cajaId: number;
  usuarioId: string;
  createdAt: string;
  updatedAt: string;
}

// Sistema de invalidación global para refrescar todos los hooks cuando hay un cambio
const invalidationListeners: Map<number | null, Set<() => void>> = new Map();

export function invalidateMovimientosCaja(cajaId: number | null) {
  const listeners = invalidationListeners.get(cajaId);
  if (listeners) {
    listeners.forEach((refetch) => refetch());
  }
}


interface UseMovimientosCajaReturn {
  movimientos: MovimientoCaja[];
  ingresos: number;
  egresos: number;
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMovimientosCaja(
  cajaId: number | null
): UseMovimientosCajaReturn {
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovimientos = useCallback(async () => {
    if (!cajaId) {
      setMovimientos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<MovimientoCajaResponse[]>(
        `/api/cajas/${cajaId}/movimientos`
      );

      // Procesar movimientos: convertir monto a number y mapear campos útiles
      const processedMovimientos: MovimientoCaja[] = response.data.map((m) => {
        const montoNum = parseFloat(m.monto); // Convertir de string a number
        const tipoNombre =
          m.tipo_movimiento_caja?.nombre ??
          ""; // En tu ejemplo viene en tipo_movimiento_caja.nombre

        return {
          id: m.id,
          monto: montoNum, // Los egresos vienen negativos, los ingresos positivos
          tipoMovimientoCajaId: m.tipo_movimiento_caja_id,
          tipoMovimientoNombre: tipoNombre,
          descripcion: m.descripcion || "",
          cajaId: m.caja_id,
          usuarioId: m.usuario_id.toString(),
          createdAt: m.created_at,
          updatedAt: m.updated_at,
        };
      });

      // Ordenar movimientos de más nuevos a más viejos
      const sortedMovimientos = processedMovimientos.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      setMovimientos(sortedMovimientos);
    } catch (err: any) {
      console.error("Error al obtener movimientos:", err);
      setError(err?.message || "Error al obtener movimientos");
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  }, [cajaId]);

  useEffect(() => {
    fetchMovimientos();
  }, [fetchMovimientos]);

  // Registrar el listener para invalidación
  useEffect(() => {
    if (!invalidationListeners.has(cajaId)) {
      invalidationListeners.set(cajaId, new Set());
    }
    const listeners = invalidationListeners.get(cajaId)!;
    listeners.add(fetchMovimientos);

    return () => {
      listeners.delete(fetchMovimientos);
      if (listeners.size === 0) {
        invalidationListeners.delete(cajaId);
      }
    };
  }, [cajaId, fetchMovimientos]);

  // Calcular ingresos, egresos y total (los egresos ya vienen negativos)
  const ingresos = movimientos
    .filter((m) => m.monto > 0)
    .reduce((sum, m) => sum + m.monto, 0);

  const egresos = Math.abs(
    movimientos
      .filter((m) => m.monto < 0)
      .reduce((sum, m) => sum + m.monto, 0)
  );

  const total = ingresos - egresos;

  return {
    movimientos,
    ingresos,
    egresos,
    total,
    loading,
    error,
    refetch: fetchMovimientos,
  };
}

