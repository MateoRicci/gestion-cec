import { useState } from "react";
import axios from "@/utils/axios";
import { useAuthContext } from "@/app/contexts/auth/context";

export type MovimientoTipo = "ingreso" | "retiro";

interface UseMovimientosReturn {
  showMovimientoModal: boolean;
  movimientoTipo: MovimientoTipo | null;
  monto: string;
  descripcion: string;
  loading: boolean;
  abrirModalMovimiento: (tipo: MovimientoTipo) => void;
  cerrarModalMovimiento: () => void;
  setMonto: (monto: string) => void;
  setDescripcion: (descripcion: string) => void;
  confirmarMovimiento: (cajaId: number, onSuccess?: () => void) => Promise<void>;
}

export function useMovimientos(): UseMovimientosReturn {
  const { user } = useAuthContext();
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [movimientoTipo, setMovimientoTipo] = useState<MovimientoTipo | null>(
    null
  );
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);

  const abrirModalMovimiento = (tipo: MovimientoTipo) => {
    setMovimientoTipo(tipo);
    setShowMovimientoModal(true);
    setMonto("");
    setDescripcion("");
  };

  const cerrarModalMovimiento = () => {
    setShowMovimientoModal(false);
    setMovimientoTipo(null);
    setMonto("");
    setDescripcion("");
  };

  const confirmarMovimiento = async (
    cajaId: number,
    onSuccess?: () => void
  ) => {
    if (!movimientoTipo || !monto || !user) {
      return;
    }

    // Convertir a número entero (remover puntos si los hay)
    const montoNum = parseInt(monto.replace(/\D/g, ""), 10);
    if (isNaN(montoNum) || montoNum <= 0) {
      return;
    }

    setLoading(true);

    try {
      const endpoint =
        movimientoTipo === "ingreso" 
          ? "/api/cajas/movimientos/ingreso-dinero" 
          : "/api/cajas/movimientos/egreso-dinero";

      // Para egresos, el monto debe ser negativo
      const montoFinal = movimientoTipo === "ingreso" ? montoNum : -montoNum;

      await axios.post(endpoint, {
        caja_id: cajaId,
        monto: montoFinal,
      });

      cerrarModalMovimiento();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error al realizar movimiento:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    showMovimientoModal,
    movimientoTipo,
    monto,
    descripcion,
    loading,
    abrirModalMovimiento,
    cerrarModalMovimiento,
    setMonto,
    setDescripcion,
    confirmarMovimiento,
  };
}

