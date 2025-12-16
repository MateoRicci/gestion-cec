/**
 * Servicio para operaciones relacionadas con ventas
 */
import axios from "@/utils/axios";
import { DetalleItem, MedioPago } from "../types";

/**
 * Obtiene los medios de pago disponibles
 */
export async function getMediosPago(): Promise<MedioPago[]> {
  const response = await axios.get<MedioPago[]>("/api/medios-pago");
  return response.data || [];
}

/**
 * Crea una nueva venta
 */
export interface VentaPayload {
  cliente_id: string;
  punto_venta_id: number;
  medio_pago_id: number;
  tipo_convenio_id: number | null;
  detalles: Array<{
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    precio_total: number;
    lista_precio_id: number;
    afiliado_id: string | null;
    es_titular: boolean;
  }>;
}

export interface VentaResponse {
  id?: number;
  venta?: { id: number };
  data?: { id: number };
}

export async function crearVenta(payload: VentaPayload): Promise<VentaResponse> {
  const response = await axios.post<VentaResponse>("/api/ventas", payload);
  return response.data;
}

/**
 * Construye el payload de venta a partir de los items del detalle
 */
export function construirVentaPayload(
  clienteId: string,
  puntoVentaId: number,
  metodoPagoId: number,
  detalleItems: DetalleItem[],
  isConsumidorFinal: boolean,
  tipoConvenioId: number | null = null
): VentaPayload {
  // Separar items en entradas de socio y entradas extra
  const entradasSocio = isConsumidorFinal
    ? []
    : detalleItems.filter(
        (item) =>
          item.id.startsWith("entrada-socio-") && item.afiliadoId !== null
      );

  const entradasExtra = detalleItems.filter(
    (item) =>
      !item.id.startsWith("entrada-socio-") ||
      isConsumidorFinal ||
      item.afiliadoId === null
  );

  // Construir detalles para entradas de socio (una por persona)
  const detallesSocio = entradasSocio.map((item) => ({
    producto_id: item.productoId,
    cantidad: item.cantidad,
    precio_unitario: item.precio,
    precio_total: item.subtotal,
    lista_precio_id: item.listaPrecioId || 0,
    afiliado_id: item.afiliadoId || null,
    es_titular: item.esTitular || false,
  }));

  // Construir detalles para entradas extra
  // Requerimiento: las entradas NO AFILIADO (agregadas manualmente) deben ir de a 1 unidad por item
  const detallesExtra: Array<{
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    precio_total: number;
    lista_precio_id: number;
    afiliado_id: string | null;
    es_titular: boolean;
  }> = [];

  entradasExtra.forEach((item) => {
    const productoNombreLower = item.productoNombre.toLowerCase();
    const nombreListaLower = item.nombreLista.toLowerCase();
    const esEntrada = productoNombreLower.includes("entrada");
    const esNoAfiliadoPorLista = nombreListaLower.includes("no afiliado");
    const esEntradaManualNoAfiliado =
      esEntrada && (item.afiliadoId === null || item.afiliadoId === undefined);

    const esEntradaNoAfiliado = esNoAfiliadoPorLista || esEntradaManualNoAfiliado;

    if (esEntradaNoAfiliado) {
      // Crear un detalle por cada unidad
      const unidades = Math.max(1, item.cantidad);
      const precioUnit = item.precio;
      for (let i = 0; i < unidades; i++) {
        detallesExtra.push({
          producto_id: item.productoId,
          cantidad: 1,
          precio_unitario: precioUnit,
          precio_total: precioUnit,
          lista_precio_id: item.listaPrecioId || 0,
          afiliado_id: null,
          es_titular: false,
        });
      }
    } else {
      // Para otros productos extra, agrupar por producto
      const existing = detallesExtra.find(
        (d) =>
          d.producto_id === item.productoId &&
          d.lista_precio_id === (item.listaPrecioId || 0) &&
          d.afiliado_id === null
      );
      if (existing) {
        existing.cantidad += item.cantidad;
        existing.precio_total += item.subtotal;
      } else {
        detallesExtra.push({
          producto_id: item.productoId,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
          precio_total: item.subtotal,
          lista_precio_id: item.listaPrecioId || 0,
          afiliado_id: null,
          es_titular: false,
        });
      }
    }
  });

  // Combinar todos los detalles
  const detalles = [...detallesSocio, ...detallesExtra];

  return {
    cliente_id: clienteId,
    punto_venta_id: puntoVentaId,
    medio_pago_id: metodoPagoId,
    tipo_convenio_id: isConsumidorFinal ? null : tipoConvenioId,
    detalles,
  };
}

