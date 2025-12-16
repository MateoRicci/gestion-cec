/**
 * Tipos e interfaces compartidas para el módulo de ventas
 */

// ============================================================================
// PRODUCTOS
// ============================================================================

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  codigo_producto: string;
  precio?: number;
  controla_stock?: boolean;
  categorias?: Array<{ id: number; nombre: string }>;
  puntos_venta?: Array<{ id: number; nombre: string }>;
}

export interface ProductoResponse {
  id: number;
  nombre: string;
  descripcion: string;
  codigo_producto: string;
  precio?: number;
  controla_stock?: boolean;
  categoria?: Array<{
    id: number;
    nombre: string;
    descripcion?: string;
    categoriaPadreId?: number | null;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  }>;
  categorias?: Array<{ id: number; nombre: string }>;
  puntos_venta?: Array<{ id: number; nombre: string }>;
}

export interface ProductoPrecioItem {
  lista_precio_id: number;
  nombre_lista: string;
  precio_unitario: string;
}

export interface ProductoPreciosResponse {
  precios: ProductoPrecioItem[];
}

// ============================================================================
// CLIENTES Y AFILIADOS
// ============================================================================

export interface Familiar {
  id_familiar: string; // id_afiliado del familiar
  id_cliente_familiar: string; // cliente UUID del familiar
  nombre_familiar: string;
  apellido_familiar: string;
  dni_familiar: string;
  relacion: string;
  edad_categoria: "mayor" | "menor";
  compro_hoy?: boolean; // Indica si ya compró/ingresó hoy
}

export interface Titular {
  id_titular: string; // id_afiliado del titular
  id_cliente_titular: string; // cliente UUID del titular
  nombre_titular: string;
  apellido_titular: string;
  dni_titular: string;
  convenio: string;
  tipo_convenio_id?: number | null; // id del tipo de convenio, null si es no afiliado
  compro_hoy?: boolean; // Indica si ya compró/ingresó hoy
}

export interface ClienteData {
  titular: Titular;
  familiares?: Familiar[];
}

export interface AfiliadoResponse {
  id_afiliado: string;
  numero_afiliado: string;
  activo: boolean;
  fecha_alta: string;
  fecha_baja: string | null;
  fecha_ultimo_aporte: string | null;
  cliente: string;
  compro_hoy?: boolean; // Indica si el titular ya compró/ingresó hoy
  convenio: {
    id: number;
    nombre: string;
  };
  titular: {
    nombre: string;
    apellido: string;
    numero_documento: number;
  };
  familiares: Array<{
    id_afiliado: string;
    tipo_familiar_id: number;
    vencimiento_cargo: string | null;
    compro_hoy?: boolean; // Indica si el familiar ya compró/ingresó hoy
    persona: {
      nombre: string;
      apellido: string;
      numero_documento: number;
      edad_categoria: string;
    };
    parentesco: string;
  }>;
}

// ============================================================================
// VENTAS Y DETALLES
// ============================================================================

export interface DetalleItem {
  id: string; // ID único para el item
  productoId: number;
  productoNombre: string;
  listaPrecioId: number;
  nombreLista: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  // Campos adicionales para entradas de socio
  afiliadoId?: string | null; // id_afiliado si es entrada de socio, null si es extra
  esTitular?: boolean; // true solo si es el titular
  dniPersona?: string; // DNI de la persona para identificar entradas de socio
}

export interface MedioPago {
  id: number;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ============================================================================
// PRECIOS DE ENTRADA
// ============================================================================

export interface PreciosEntrada {
  precioEntradaNoSocio: number | null;
  productoEntradaId: number | null;
  productoEntradaMayorId: number | null;
  productoEntradaMenorId: number | null;
  precioEntradaMayor: number | null;
  precioEntradaMenor: number | null;
  listaPrecioIdSocio: number; // Por defecto id 1, cambia a 2 si es empleado
}

