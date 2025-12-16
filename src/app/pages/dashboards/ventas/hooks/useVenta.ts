/**
 * Hook para gestionar el proceso de venta
 */
import { useState, useEffect } from "react";
import { MedioPago, DetalleItem } from "../types";
import { getMediosPago, crearVenta, construirVentaPayload } from "../services/ventaService";
import { generateRecibo } from "@/utils/generateRecibo";
import { PuntoDeVenta } from "@/app/contexts/ventas/context";
import { ClienteData } from "../types";

export function useVenta() {
  const [mediosPago, setMediosPago] = useState<MedioPago[]>([]);
  const [isLoadingMediosPago, setIsLoadingMediosPago] = useState(true);
  const [metodoPagoId, setMetodoPagoId] = useState<number | null>(null);
  const [isProcesandoVenta, setIsProcesandoVenta] = useState(false);
  const [showVentaExitoModal, setShowVentaExitoModal] = useState(false);
  const [showVentaErrorModal, setShowVentaErrorModal] = useState(false);
  const [ventaErrorMessage, setVentaErrorMessage] = useState("");

  // Cargar medios de pago
  useEffect(() => {
    const loadMediosPago = async () => {
      setIsLoadingMediosPago(true);
      try {
        const medios = await getMediosPago();
        if (medios.length > 0) {
          setMediosPago(medios);
          setMetodoPagoId(medios[0].id);
        }
      } catch (error) {
        console.error("Error al cargar medios de pago:", error);
        setMediosPago([]);
      } finally {
        setIsLoadingMediosPago(false);
      }
    };

    loadMediosPago();
  }, []);

  const procesarVenta = async (
    clienteId: string,
    clienteData: ClienteData | null,
    dni: string,
    detalleItems: DetalleItem[],
    puntoDeVenta: PuntoDeVenta,
    isConsumidorFinal: boolean,
    refreshCajaEstado: () => Promise<void>
  ) => {
    if (!metodoPagoId) {
      throw new Error("No se ha seleccionado un método de pago");
    }

    setIsProcesandoVenta(true);
    setVentaErrorMessage("");

    try {
      // Construir payload
      const tipoConvenioId = clienteData?.titular?.tipo_convenio_id || null;
      const payload = construirVentaPayload(
        clienteId,
        puntoDeVenta.id,
        metodoPagoId,
        detalleItems,
        isConsumidorFinal,
        tipoConvenioId
      );

      console.log("Payload de venta a enviar:", JSON.stringify(payload, null, 2));

      // Crear venta
      const response = await crearVenta(payload);
      console.log("Respuesta del servidor:", response);

      // Obtener ID de venta
      const ventaId =
        response?.id || response?.venta?.id || response?.data?.id;
      const numeroRecibo = ventaId ? ventaId.toString() : "000";

      // Obtener nombre del método de pago
      const medioPagoSeleccionado = mediosPago.find(
        (mp) => mp.id === metodoPagoId
      );
      const metodoPagoNombre = medioPagoSeleccionado?.nombre || "Efectivo";

      // Generar recibo PDF
      await generateRecibo({
        cliente:
          clienteData ||
          ({
            titular: {
              id_titular: "",
              id_cliente_titular: clienteId,
              nombre_titular: "",
              apellido_titular: "",
              dni_titular: dni,
              convenio: "No Afiliado",
              tipo_convenio_id: null,
            },
          } as ClienteData),
        detalleItems,
        puntoDeVenta,
        metodoPago: metodoPagoNombre,
        numeroRecibo,
      });

      // Refrescar estado de caja
      await refreshCajaEstado();

      // Mostrar modal de éxito
      setShowVentaExitoModal(true);
    } catch (error: any) {
      console.error("Error al procesar la venta:", error);
      setVentaErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Error al procesar la venta. Por favor, intenta nuevamente."
      );
      setShowVentaErrorModal(true);
      throw error;
    } finally {
      setIsProcesandoVenta(false);
    }
  };

  const cerrarModalExito = () => {
    setShowVentaExitoModal(false);
  };

  const cerrarModalError = () => {
    setShowVentaErrorModal(false);
    setVentaErrorMessage("");
  };

  return {
    mediosPago,
    isLoadingMediosPago,
    metodoPagoId,
    setMetodoPagoId,
    isProcesandoVenta,
    showVentaExitoModal,
    showVentaErrorModal,
    ventaErrorMessage,
    procesarVenta,
    cerrarModalExito,
    cerrarModalError,
  };
}

