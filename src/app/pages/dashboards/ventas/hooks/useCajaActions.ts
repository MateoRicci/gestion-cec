import { useState } from "react";
import { useVentasContext } from "@/app/contexts/ventas/context";
import { useAuthContext } from "@/app/contexts/auth/context";
import { ModalState } from "@/components/shared/ConfirmModal";
import axios from "@/utils/axios";
import { getFechaHoy } from "../utils/cajaHelpers";
import { PuntoDeVenta } from "@/app/contexts/ventas/context";
import { generateTicketCierre } from "@/utils/generateTicketCierre";
import { MedioPago } from "../types";

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
  const { setCajaAbierta, getCajaId, refreshCajaEstado } = useVentasContext();
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
      await axios.post<{ id: number }>("/api/cajas/abrir", {
        nombre: `Caja ${currentPv.nombre}`,
        descripcion: `Caja del dia ${fechaHoy}`,
        punto_venta_id: currentPv.id,
      });

      // Refrescar el estado de la caja desde el servidor
      await refreshCajaEstado();
      
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
    if (!currentPv || !user) {
      console.error("No hay punto de venta o usuario seleccionado");
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
      // Obtener datos reales de la caja, movimientos y ventas
      
      // 1. Obtener información de la caja (usar el endpoint de caja abierta)
      const cajaResponse = await axios.get<{ id: number; nombre: string; descripcion: string; usuario_id: number; punto_venta_id: number }>("/api/cajas/abierta");
      const caja = cajaResponse.data;
      
      // 2. Obtener movimientos de la caja
      const movimientosResponse = await axios.get(`/api/cajas/${cajaId}/movimientos`);
      const movimientosData = movimientosResponse.data;
      
      // 3. Obtener ventas de la caja usando el endpoint correcto
      let ventasData: any[] = [];
      try {
        const ventasResponse = await axios.get(`/api/ventas?caja_id=${cajaId}`);
        ventasData = ventasResponse.data || [];
      } catch (error) {
        console.warn("No se pudo obtener las ventas de la caja:", error);
      }

      // 4. Obtener medios de pago desde el endpoint (evitar hardcodear IDs)
      let mediosPago: MedioPago[] = [];
      try {
        const mediosResponse = await axios.get<MedioPago[]>("/api/medios-pago");
        mediosPago = mediosResponse.data || [];
      } catch (error) {
        console.warn("No se pudieron obtener los medios de pago:", error);
        mediosPago = [];
      }
      const mediosPagoMap = new Map<number, string>(
        mediosPago.map((mp) => [mp.id, mp.nombre])
      );
      
      // Filtrar movimientos manuales (excluir movimientos de ventas) SOLO para el resumen agrupado,
      // pero NO para el cálculo de ingresos/egresos, donde debemos considerar cualquier monto negativo.
      const movimientosManuales = movimientosData.filter((mov: any) => {
        const accionType = mov.accion_movimiento_type?.toLowerCase() || "";
        // Excluir movimientos que sean de ventas
        return !accionType.includes("venta") && !accionType.includes("sale");
      });
      
      // Procesar movimientos manuales: agrupar por tipo y subtipo
      const movimientosAgrupados = new Map<string, { tipo: string; subtipo?: string; monto: number }>();
      
      movimientosManuales.forEach((mov: any) => {
        const tipoNombre = mov.tipo_movimiento_caja?.nombre || "Movimiento";
        const montoNum = parseFloat(mov.monto);
        
        // Determinar si es ingreso o egreso basado en el signo del monto
        const esIngreso = montoNum > 0;
        const tipoBase = esIngreso ? "Ingreso" : "Egreso";
        
        // Extraer subtipo del nombre si existe (Mayor/Menor)
        let subtipo: string | undefined;
        const nombreLower = tipoNombre.toLowerCase();
        if (nombreLower.includes("mayor")) {
          subtipo = "Mayor";
        } else if (nombreLower.includes("menor")) {
          subtipo = "Menor";
        }
        
        // Crear clave única para agrupar
        const key = subtipo ? `${tipoBase} - ${subtipo}` : tipoBase;
        
        // Agregar o sumar al monto existente
        const existing = movimientosAgrupados.get(key);
        if (existing) {
          existing.monto += Math.abs(montoNum); // Usar valor absoluto para agrupar
        } else {
          movimientosAgrupados.set(key, {
            tipo: tipoBase,
            subtipo,
            monto: Math.abs(montoNum),
          });
        }
      });
      
      // Convertir a array
      const movimientosResumen = Array.from(movimientosAgrupados.values());
      
      // Calcular ingresos y egresos en efectivo:
      // - Ingresos: todos los montos positivos
      // - Egresos: todos los montos negativos (incluyendo devoluciones/cancelaciones de ventas)
      const ingresos = movimientosData
        .filter((m: any) => parseFloat(m.monto) > 0)
        .reduce((sum: number, m: any) => sum + parseFloat(m.monto), 0);
      
      const egresos = Math.abs(
        movimientosData
          .filter((m: any) => parseFloat(m.monto) < 0)
          .reduce((sum: number, m: any) => sum + parseFloat(m.monto), 0)
      );
      
      // Calcular ventas en efectivo y balance por método de pago usando nombres desde la API
      const efectivoId =
        mediosPago.find(
          (mp) => mp.nombre?.toLowerCase().includes("efectivo")
        )?.id ?? null;

      const ventasEfectivo = ventasData
        .filter((v: any) => {
          if (efectivoId !== null) return v.medio_pago_id === efectivoId;
          const nombre = v.medio_pago?.nombre?.toLowerCase() || "";
          return nombre.includes("efectivo");
        })
        .reduce(
          (sum: number, v: any) => sum + (parseFloat(v.monto_total) || 0),
          0
        );

      const balanceMetodosPagoMap = new Map<string, number>();
      ventasData.forEach((venta: any) => {
        const metodoPagoId = venta.medio_pago_id || 0;
        const nombreDesdeApi = mediosPagoMap.get(metodoPagoId);
        const nombreDesdeVenta = venta.medio_pago?.nombre;
        const metodoPago = nombreDesdeApi || nombreDesdeVenta || "Otro";
        const total = parseFloat(venta.monto_total) || 0;
        const current = balanceMetodosPagoMap.get(metodoPago) || 0;
        balanceMetodosPagoMap.set(metodoPago, current + total);
      });

      const balanceMetodosPago = Array.from(balanceMetodosPagoMap.entries()).map(
        ([metodoPago, monto]) => ({
          metodoPago,
          monto,
        })
      );
      
      // Calcular balance de efectivo
      const balanceEfectivo = {
        ingresos,
        egresos,
        ventasEfectivo,
        total: ingresos - egresos + ventasEfectivo,
      };
      
      // Obtener nombre del usuario que abrió la caja desde el localStorage
      // El username se guarda en localStorage como "username" dentro del objeto user
      let usuarioApertura = "Usuario";
      try {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          const authData = JSON.parse(authStorage);
          usuarioApertura = authData?.state?.user?.username || user?.email || "Usuario";
        }
      } catch (error) {
        console.warn("Error al obtener username del localStorage:", error);
        usuarioApertura = user?.email || "Usuario";
      }
      
      // Procesar resumen por convenio
      // Precios fijos por tipo de entrada
      const PRECIO_CONVENIO = 0; // Entradas con convenio: $0
      const PRECIO_SIN_CONVENIO = 5000; // Entradas sin convenio: $5000
      
      const conveniosMap = new Map<string, { cantidad: number; monto: number }>();
      
      ventasData.forEach((venta: any) => {
        const afiliado = venta.cliente?.persona?.afiliado;
        const tieneConvenio = afiliado !== null && afiliado !== undefined;
        
        if (tieneConvenio) {
          // Si tiene convenio, sumar las entradas con convenio a ese convenio específico
          const nombreConvenio = afiliado.tipo_convenio?.nombre || "Convenio sin nombre";
          const cantidadConConvenio = parseInt(venta.total_detalles_convenio) || 0;
          const cantidadSinConvenio = parseInt(venta.total_detalles_sin_convenio) || 0;
          
          // Sumar entradas con convenio al convenio específico (monto = cantidad * precio convenio)
          if (cantidadConConvenio > 0) {
            const current = conveniosMap.get(nombreConvenio) || { cantidad: 0, monto: 0 };
            conveniosMap.set(nombreConvenio, {
              cantidad: current.cantidad + cantidadConConvenio,
              monto: current.monto + (cantidadConConvenio * PRECIO_CONVENIO),
            });
          }
          
          // Sumar entradas sin convenio al contador "Sin convenio"
          if (cantidadSinConvenio > 0) {
            const current = conveniosMap.get("Sin convenio") || { cantidad: 0, monto: 0 };
            conveniosMap.set("Sin convenio", {
              cantidad: current.cantidad + cantidadSinConvenio,
              monto: current.monto + (cantidadSinConvenio * PRECIO_SIN_CONVENIO),
            });
          }
        } else {
          // Si no tiene convenio (afiliado es null), sumar solo al contador "Sin convenio"
          const cantidadSinConvenio = parseInt(venta.total_detalles_sin_convenio) || 0;
          
          if (cantidadSinConvenio > 0) {
            const current = conveniosMap.get("Sin convenio") || { cantidad: 0, monto: 0 };
            conveniosMap.set("Sin convenio", {
              cantidad: current.cantidad + cantidadSinConvenio,
              monto: current.monto + (cantidadSinConvenio * PRECIO_SIN_CONVENIO),
            });
          }
        }
      });
      
      // Convertir a array para el ticket
      const resumenConvenios = Array.from(conveniosMap.entries()).map(([convenio, data]) => ({
        convenio,
        cantidad: data.cantidad,
        monto: data.monto,
      }));
      
      const fechaCierre = new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Generar el ticket de cierre con datos reales
      await generateTicketCierre({
        caja: {
          id: caja.id,
          nombre: caja.nombre || `Caja ${currentPv.nombre}`,
          descripcion: caja.descripcion || `Caja del día ${getFechaHoy()}`,
          usuarioApertura,
        },
        movimientos: movimientosResumen,
        balanceEfectivo,
        balanceMetodosPago,
        resumenConvenios,
        fechaCierre,
      });

      // Funcionalidad real de cierre de caja (comentadas temporalmente)
      // await axios.patch(`/api/cajas/${cajaId}/cerrar`);
      // await refreshCajaEstado();
      // setCajaAbierta(false);
      
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

