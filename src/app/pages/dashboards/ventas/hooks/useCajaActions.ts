import { useState } from "react";
import { useVentasContext } from "@/app/contexts/ventas/context";
import { useAuthContext } from "@/app/contexts/auth/context";
import { ModalState } from "@/components/shared/ConfirmModal";
import axios from "@/utils/axios";
import { getFechaHoy } from "../utils/cajaHelpers";
import { PuntoDeVenta } from "@/app/contexts/ventas/context";

interface UseCajaActionsReturn {
  showConfirmModal: boolean;
  confirmAction: "abrir" | "cerrar" | null;
  confirmLoading: boolean;
  confirmState: ModalState;
  solicitarAbrirCaja: () => void;
  solicitarCerrarCaja: () => void;
  confirmarAccion: () => void;
  getConfirmMessages: () => any;
  closeConfirmModal: () => void;
}

export function useCajaActions(
  currentPv: PuntoDeVenta | undefined
): UseCajaActionsReturn {
  const { setCajaAbierta, setCajaIdPorPuntoVenta, getCajaId } = useVentasContext();
  const { user } = useAuthContext();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"abrir" | "cerrar" | null>(
    null
  );
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmState, setConfirmState] = useState<ModalState>("pending");
  // Mantener la acción durante la animación de cierre
  const [lastConfirmAction, setLastConfirmAction] = useState<"abrir" | "cerrar" | null>(null);

  const handleAbrirCaja = async () => {
    if (!currentPv || !user) {
      console.error("No hay punto de venta o usuario seleccionado");
      return;
    }

    setConfirmLoading(true);
    setConfirmState("pending");

    try {
      const fechaHoy = getFechaHoy();
      const response = await axios.post<{ id: number }>("/cajas/abrir", {
        nombre: `Caja de ${currentPv.nombre}`,
        descripcion: fechaHoy,
        puntoVentaId: currentPv.id,
        usuarioId: user.id,
      });

      // Guardar el ID de la caja para este punto de venta
      if (response.data?.id) {
        setCajaIdPorPuntoVenta(currentPv.id.toString(), response.data.id);
      }

      setCajaAbierta(true);
      setConfirmState("success");
      // Guardar la acción actual antes de resetear
      setLastConfirmAction(confirmAction);

      setTimeout(() => {
        // Cerrar el modal
        setShowConfirmModal(false);
        // Esperar a que termine la animación de cierre antes de resetear el estado
        setTimeout(() => {
          setConfirmState("pending");
          setConfirmAction(null);
          setLastConfirmAction(null);
        }, 250); // Tiempo de la animación de salida (200ms + margen)
      }, 1500);
    } catch (error: any) {
      console.error("Error al abrir la caja:", error);
      setConfirmState("error");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCerrarCaja = async () => {
    if (!currentPv) {
      console.error("No hay punto de venta seleccionado");
      return;
    }

    const cajaId = getCajaId(currentPv.id.toString());
    if (!cajaId) {
      console.error("No hay caja abierta para este punto de venta");
      setConfirmState("error");
      return;
    }

    setConfirmLoading(true);
    setConfirmState("pending");

    try {
      await axios.patch(`/cajas/cerrar/${cajaId}`);

      // Limpiar el ID de la caja para este punto de venta
      setCajaIdPorPuntoVenta(currentPv.id.toString(), null);
      setCajaAbierta(false);
      setConfirmState("success");
      // Guardar la acción actual antes de resetear
      setLastConfirmAction(confirmAction);

      setTimeout(() => {
        // Cerrar el modal
        setShowConfirmModal(false);
        // Esperar a que termine la animación de cierre antes de resetear el estado
        setTimeout(() => {
          setConfirmState("pending");
          setConfirmAction(null);
          setLastConfirmAction(null);
        }, 250); // Tiempo de la animación de salida (200ms + margen)
      }, 1500);
    } catch (error: any) {
      console.error("Error al cerrar la caja:", error);
      setConfirmState("error");
    } finally {
      setConfirmLoading(false);
    }
  };

  const solicitarAbrirCaja = () => {
    setConfirmAction("abrir");
    setShowConfirmModal(true);
  };

  const solicitarCerrarCaja = () => {
    setConfirmAction("cerrar");
    setShowConfirmModal(true);
  };

  const confirmarAccion = () => {
    if (confirmAction === "abrir") {
      handleAbrirCaja();
    } else if (confirmAction === "cerrar") {
      handleCerrarCaja();
    }
  };

  const getConfirmMessages = () => {
    // Usar la última acción si confirmAction es null (durante la animación de cierre)
    const action = confirmAction || lastConfirmAction;
    
    if (action === "abrir") {
      return {
        pending: {
          title: "¿Abrir caja?",
          description: `¿Estás seguro de que deseas abrir la caja para el punto de venta "${currentPv?.nombre}"?`,
          actionText: "Abrir caja",
        },
        success: {
          title: "Caja abierta",
          description: "La caja se ha abierto correctamente.",
          actionText: "Aceptar",
        },
        error: {
          title: "Error al abrir caja",
          description: "No se pudo abrir la caja. Por favor, intenta nuevamente.",
          actionText: "Cerrar",
        },
      };
    } else {
      return {
        pending: {
          title: "¿Cerrar caja?",
          description: `¿Estás seguro de que deseas cerrar la caja para el punto de venta "${currentPv?.nombre}"?`,
          actionText: "Cerrar caja",
        },
        success: {
          title: "Caja cerrada",
          description: "La caja se ha cerrado correctamente.",
          actionText: "Aceptar",
        },
        error: {
          title: "Error al cerrar caja",
          description: "No se pudo cerrar la caja. Por favor, intenta nuevamente.",
          actionText: "Cerrar",
        },
      };
    }
  };

  const closeConfirmModal = () => {
    if (!confirmLoading) {
      setShowConfirmModal(false);
      setConfirmState("pending");
      setConfirmAction(null);
    }
  };

  return {
    showConfirmModal,
    confirmAction,
    confirmLoading,
    confirmState,
    solicitarAbrirCaja,
    solicitarCerrarCaja,
    confirmarAccion,
    getConfirmMessages,
    closeConfirmModal,
  };
}

