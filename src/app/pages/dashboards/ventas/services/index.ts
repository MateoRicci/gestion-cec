/**
 * Archivo de barril para exportar todos los servicios del módulo de ventas
 */

export {
  buscarAfiliadoPorDni,
  mapAfiliadoToClienteData,
} from "./clienteService";

export {
  loadPrecioEntradaNoSocio,
  loadPrecioEntradaSocio,
} from "./preciosEntradaService";

export {
  getProductos,
  getProductoPrecios,
  findProductosEntrada,
} from "./productosService";

export {
  getMediosPago,
  crearVenta,
  construirVentaPayload,
} from "./ventaService";
export type { VentaPayload, VentaResponse } from "./ventaService";

