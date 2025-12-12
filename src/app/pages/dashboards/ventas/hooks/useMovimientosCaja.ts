import { useState, useEffect, useCallback } from "react";
import axios from "@/utils/axios";

export interface TipoMovimientoCaja {
  id: number;
  nombre: string;
  descripcion: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface MovimientoCajaResponse {
  id: number;
  monto: number;
  tipoMovimientoCajaId: number;
  descripcion: string;
  cajaId: number;
  usuarioId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  tipoMovimientoCaja: TipoMovimientoCaja;
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

// Map global de tipos de movimiento (id -> nombre)
let tiposMovimientoMap: Map<number, string> = new Map();

// Función para cargar los tipos de movimiento
async function loadTiposMovimiento(): Promise<Map<number, string>> {
  try {
    const response = await axios.get<TipoMovimientoCaja[]>("/cajas/movimientos/tipos");
    const map = new Map<number, string>();
    response.data.forEach((tipo) => {
      map.set(tipo.id, tipo.nombre);
    });
    tiposMovimientoMap = map;
    return map;
  } catch (error) {
    console.error("Error al cargar tipos de movimiento:", error);
    return tiposMovimientoMap;
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

  // Cargar tipos de movimiento al montar el componente
  useEffect(() => {
    loadTiposMovimiento();
  }, []);

  const fetchMovimientos = useCallback(async () => {
    if (!cajaId) {
      setMovimientos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Asegurar que los tipos estén cargados
      const tiposMap = tiposMovimientoMap.size > 0 
        ? tiposMovimientoMap 
        : await loadTiposMovimiento();

      const response = await axios.get<MovimientoCajaResponse[]>(
        `/cajas/movimientos/${cajaId}`
      );

      // Procesar movimientos: usar el monto tal cual viene del backend (ya tiene el signo correcto)
      const processedMovimientos: MovimientoCaja[] = response.data.map((m) => {
        const tipoNombre = tiposMap.get(m.tipoMovimientoCajaId) || m.tipoMovimientoCaja.nombre;
        
        return {
          id: m.id,
          monto: m.monto, // Usar el monto directamente del backend (negativo para egresos, positivo para ingresos)
          tipoMovimientoCajaId: m.tipoMovimientoCajaId,
          tipoMovimientoNombre: tipoNombre,
          descripcion: m.descripcion,
          cajaId: m.cajaId,
          usuarioId: m.usuarioId,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
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

