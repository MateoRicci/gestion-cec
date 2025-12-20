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
      
      // log caja
      console.log("caja", caja);
      
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
        // si el nombre no contiene manual no lo agrego
        if (!mov.tipo_movimiento_caja?.nombre?.toLowerCase().includes("manual")) {
          return;
        }

        const tipoNombre = mov.tipo_movimiento_caja?.nombre || "Movimiento";
        const montoNum = parseFloat(mov.monto);
        
        if(tipoNombre !== "Ingreso Manual" && tipoNombre !== "Egreso Manual") {
          return;
        }
        // Crear clave única para agrupar
        const key = tipoNombre;
        
        // Agregar o sumar al monto existente
        const existing = movimientosAgrupados.get(key);
        if (existing) {
          existing.monto += Math.abs(montoNum); // Usar valor absoluto para agrupar
        } else {
          movimientosAgrupados.set(key, {
            tipo: tipoNombre,
            monto: Math.abs(montoNum),
          });
        }
      });
      
      // Convertir a array
      const movimientosResumen = Array.from(movimientosAgrupados.values());
      console.log("movimientosResumen", movimientosResumen);
      
      // Calcular ventas en efectivo y balance por método de pago usando nombres desde la API
      // LAS VENTAS NO CANCELADAS SOLO SE SUMAN LAS QUE SON EN EFECTIVO
      const efectivoId =
        mediosPago.find(
          (mp) => mp.nombre?.toLowerCase().includes("efectivo")
        )?.id ?? null;

      // Función helper para determinar si un movimiento es MANUAL (no de venta)
      const esMovimientoManual = (mov: any): boolean => {
        // Los movimientos manuales tienen accion_movimiento_type = null o undefined
        // También verificamos por el nombre del tipo de movimiento que debe contener "manual"
        const accionType = mov.accion_movimiento_type;
        const tipoNombre = mov.tipo_movimiento_caja?.nombre?.toLowerCase() || "";
        const esManual = tipoNombre.includes("manual");
        
        // Es manual si: accion_movimiento_type es null/undefined Y el nombre contiene "manual"
        return (accionType === null || accionType === undefined) && esManual;
      };

      // Calcular ingresos y egresos MANUALES (excluyendo movimientos de ventas):
      // - Ingresos: solo movimientos manuales positivos
      // - Egresos: solo movimientos manuales negativos
      const ingresos = movimientosData
        .filter((m: any) => {
          const monto = parseFloat(m.monto);
          return monto > 0 && esMovimientoManual(m);
        })
        .reduce((sum: number, m: any) => sum + parseFloat(m.monto), 0);
      
      const egresos = Math.abs(
        movimientosData
          .filter((m: any) => {
            const monto = parseFloat(m.monto);
            return monto < 0 && esMovimientoManual(m);
          })
          .reduce((sum: number, m: any) => sum + parseFloat(m.monto), 0)
      );

      // Calcular ventas canceladas en efectivo (para restarlas como egresos)
      const ventasEfectivoCanceladas = ventasData
        .filter((v: any) => {
          const esEfectivo = efectivoId !== null 
            ? v.medio_pago_id === efectivoId 
            : (v.medio_pago?.nombre?.toLowerCase() || "").includes("efectivo");
          return esEfectivo && v.estado?.nombre === "Cancelada";
        })
        .reduce(
          (sum: number, v: any) => sum + (parseFloat(v.monto_total) || 0),
          0
        );

      // Calcular TODAS las ventas en efectivo (incluyendo canceladas)
      // Las canceladas se restan después en egresos, pero deben aparecer aquí para el balance correcto
      const ventasEfectivo = ventasData
        .filter((v: any) => {
          const esEfectivo = efectivoId !== null 
            ? v.medio_pago_id === efectivoId 
            : (v.medio_pago?.nombre?.toLowerCase() || "").includes("efectivo");
          return esEfectivo; // Incluir todas las ventas en efectivo, canceladas y no canceladas
        })
        .reduce(
          (sum: number, v: any) => sum + (parseFloat(v.monto_total) || 0),
          0
        );

      // Resumen por método de pago: NO incluir ventas canceladas
      const balanceMetodosPagoMap = new Map<string, number>();
      ventasData.forEach((venta: any) => {
        // Excluir ventas canceladas del resumen por método de pago
        if (venta.estado?.nombre === "Cancelada") {
          return;
        }
        
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
      // Las ventas canceladas se muestran por separado, no se suman a egresos
      const balanceEfectivo = {
        ingresos,
        egresos, // Solo egresos manuales, sin ventas canceladas
        ventasEfectivo,
        ventasEfectivoCanceladas: Math.abs(ventasEfectivoCanceladas),
        total: ingresos - egresos + ventasEfectivo - Math.abs(ventasEfectivoCanceladas),
      };
      console.log("balanceEfectivo", balanceEfectivo);
      console.log("ventasEfectivoCanceladas", ventasEfectivoCanceladas);
      console.log("ventasEfectivo", ventasEfectivo);
      console.log("ingresos", ingresos);
      console.log("egresos", egresos);
      console.log("total", ingresos - (egresos + Math.abs(ventasEfectivoCanceladas)) + ventasEfectivo);
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
      const PRECIO_CONVENIO_EMPLEADOS = 4000;
      const PRECIO_SIN_CONVENIO = 5000; // Entradas sin convenio: $5000

      // Usar una sola declaración de ventasEfectivo para evitar 'Cannot redeclare block-scoped variable'
      const conveniosMap = new Map<string, { cantidad: number; monto: number }>();
      // Eliminar la redeclaración de ventasEfectivo aquí, ya que debe declararse solo una vez en el archivo.

      ventasData.forEach((venta: any) => {
        // Si la venta está cancelada no la sumo:
        if (venta.estado?.nombre !== "Cancelada") {
          
          
          const afiliado = venta.cliente?.persona?.afiliado;
          const tieneConvenio = afiliado !== null && afiliado !== undefined;
          
          if (tieneConvenio) {
            // Si tiene convenio, sumar las entradas con convenio a ese convenio específico
            const nombreConvenio = afiliado.tipo_convenio?.nombre || "Convenio sin nombre";
            const cantidadConConvenio = parseInt(venta.total_detalles_convenio) || 0;
            const cantidadSinConvenio = parseInt(venta.total_detalles_sin_convenio) || 0;
            
            // Sumar entradas con convenio al convenio específico (monto = cantidad * precio convenio)
            if (cantidadConConvenio > 0) {
              let precio = PRECIO_CONVENIO;
              if (nombreConvenio.toLowerCase().includes("Empleado CEC")) {
                precio = PRECIO_CONVENIO_EMPLEADOS;
              }
              const current = conveniosMap.get(nombreConvenio) || { cantidad: 0, monto: 0 };
              conveniosMap.set(nombreConvenio, {
              cantidad: current.cantidad + cantidadConConvenio,
              monto: current.monto + (cantidadConConvenio * precio),
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
        }
      });
      
      // Convertir a array para el ticket
      const resumenConvenios = Array.from(conveniosMap.entries()).map(([convenio, data]) => ({
        convenio,
        cantidad: data.cantidad,
        monto: data.monto,
      }));

      // Calcular cantidad de personas ingresadas por tipo de convenio (solo ventas NO canceladas)
      const personasPorConvenioMap = new Map<string, number>();
      
      ventasData
        .filter((venta: any) => venta.estado?.nombre !== "Cancelada")
        .forEach((venta: any) => {
          // Procesar total_detalles_convenio
          const cantidadConvenio = parseInt(venta.total_detalles_convenio) || 0;
          if (cantidadConvenio > 0) {
            const nombreConvenio = venta.tipo_convenio?.nombre || "Sin Convenio";
            const current = personasPorConvenioMap.get(nombreConvenio) || 0;
            personasPorConvenioMap.set(nombreConvenio, current + cantidadConvenio);
          }
          
          // Procesar total_detalles_sin_convenio
          const cantidadSinConvenio = parseInt(venta.total_detalles_sin_convenio) || 0;
          if (cantidadSinConvenio > 0) {
            const current = personasPorConvenioMap.get("Sin Convenio") || 0;
            personasPorConvenioMap.set("Sin Convenio", current + cantidadSinConvenio);
          }
        });
      
      // Convertir a array para el ticket
      const personasPorConvenio = Array.from(personasPorConvenioMap.entries())
        .map(([convenio, cantidad]) => ({
          convenio,
          cantidad,
        }))
        .sort((a, b) => {
          // "Sin Convenio" al final
          if (a.convenio === "Sin Convenio") return 1;
          if (b.convenio === "Sin Convenio") return -1;
          return a.convenio.localeCompare(b.convenio);
        });
      
      const fechaCierre = new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Funcionalidad real de cierre de caja:
      // 1) Cerrar caja en backend
      // 2) Refrescar estado en frontend
      // 3) Marcar caja como cerrada en el contexto
      await axios.patch(`/api/cajas/${cajaId}/cerrar`);
      await refreshCajaEstado();
      setCajaAbierta(false);

      // 4) Una vez que el cierre se realizó correctamente, generar el ticket
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
        personasPorConvenio,
        fechaCierre,
      });
      
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

