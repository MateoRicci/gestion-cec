# Documentación Completa del Módulo de Ventas

## 📋 Índice

1. [Estructura del Módulo](#estructura-del-módulo)
2. [Arquitectura y Principios](#arquitectura-y-principios)
3. [Tipos e Interfaces](#tipos-e-interfaces)
4. [Servicios](#servicios)
5. [Hooks Personalizados](#hooks-personalizados)
6. [Componentes](#componentes)
7. [Vistas Principales](#vistas-principales)
8. [Flujo de Trabajo](#flujo-de-trabajo)
9. [Guía de Desarrollo](#guía-de-desarrollo)
10. [Troubleshooting](#troubleshooting)

---

## 🗂️ Estructura del Módulo

```
ventas/
├── types/                          # Tipos e interfaces TypeScript
│   └── index.ts                    # Todas las definiciones de tipos
│
├── services/                       # Servicios API (capa de datos)
│   ├── index.ts                    # Exports centralizados
│   ├── productosService.ts         # Operaciones con productos
│   ├── clienteService.ts           # Operaciones con clientes/afiliados
│   ├── ventaService.ts             # Operaciones de venta
│   └── preciosEntradaService.ts    # Operaciones con precios de entrada
│
├── hooks/                          # Hooks personalizados (lógica de estado)
│   ├── index.ts                    # Exports centralizados
│   ├── useProductos.ts             # Gestión de productos
│   ├── useCliente.ts               # Gestión de clientes
│   ├── usePreciosEntrada.ts        # Gestión de precios de entrada
│   ├── useDetalleVenta.ts          # Gestión del detalle/carrito
│   ├── useVenta.ts                 # Proceso completo de venta
│   ├── useCajaActions.ts           # Acciones de abrir/cerrar caja
│   ├── useMovimientos.ts           # Movimientos de efectivo
│   └── useMovimientosCaja.ts       # Consulta de movimientos de caja
│
├── components/                     # Componentes UI
│   ├── index.ts                    # Exports centralizados
│   │
│   ├── caja/                       # Componentes relacionados con caja
│   │   ├── CajaSection.tsx         # Sección completa de caja (nuevo)
│   │   ├── CajaEstado.tsx          # Estado de la caja
│   │   ├── CajaControls.tsx        # Controles de caja
│   │   ├── CajaResumen.tsx         # Resumen de caja
│   │   ├── CajaMovimientos.tsx     # Lista de movimientos
│   │   └── MovimientoModal.tsx     # Modal de movimientos
│   │
│   ├── venta/                      # Componentes relacionados con ventas
│   │   ├── VentasSection.tsx       # Sección completa de ventas (nuevo)
│   │   ├── DetalleVenta.tsx        # Panel de detalle de venta
│   │   └── PuntoDeVentaSelector.tsx # Selector de punto de venta
│   │
│   ├── cliente/                    # Componentes relacionados con clientes
│   │   └── ClienteForm.tsx         # Formulario de búsqueda de cliente
│   │
│   └── producto/                   # Componentes relacionados con productos
│       ├── ProductosGrid.tsx       # Grid de productos
│       └── ProductoPreciosModal.tsx # Modal de selección de precios
│
├── utils/                          # Utilidades
│   └── cajaHelpers.ts              # Funciones auxiliares de caja
│
├── _unused/                        # Archivos no utilizados (reservados)
│   └── CajaView.tsx                # Vista de caja (no usada actualmente)
│
├── PuntoDeVentaView.tsx            # Vista principal (orquestador)
├── index.tsx                       # Punto de entrada del módulo
└── venta.md                        # Esta documentación
```

### Cambios en la Reestructuración

**Antes:**
- `PuntoDeVentaView.tsx` tenía más de 400 líneas con toda la lógica mezclada
- Componentes duplicados (`CajaHeader` vs `PuntoDeVentaSelector`)
- `CajaView.tsx` no se utilizaba pero estaba en la raíz

**Después:**
- `PuntoDeVentaView.tsx` reducido a ~30 líneas (solo orquestación)
- Lógica separada en `CajaSection` y `VentasSection`
- Componentes duplicados eliminados
- Archivos no usados movidos a `_unused/`
- Archivos de barril (`index.ts`) para exports organizados

---

## 🏗️ Arquitectura y Principios

### Principios de Diseño

1. **Separación de Responsabilidades**
   - **Types**: Solo definiciones de tipos e interfaces
   - **Services**: Llamadas a API y transformación de datos
   - **Hooks**: Lógica de estado y efectos de React
   - **Components**: Presentación y UI pura
   - **Views**: Composición de componentes (orquestación)

2. **Composición sobre Herencia**
   - Componentes pequeños y reutilizables
   - Secciones compuestas por múltiples componentes
   - Hooks especializados por funcionalidad

3. **Single Responsibility**
   - Cada hook tiene una responsabilidad específica
   - Cada componente tiene un propósito claro
   - Cada servicio maneja un dominio específico

4. **DRY (Don't Repeat Yourself)**
   - Lógica compartida en hooks
   - Componentes reutilizables
   - Servicios centralizados

### Flujo de Datos

```
Usuario
  ↓
Componente (UI)
  ↓
Hook (Lógica de Estado)
  ↓
Service (Llamadas API)
  ↓
Backend API
  ↓
Service (Transformación)
  ↓
Hook (Actualización de Estado)
  ↓
Componente (Re-render)
  ↓
Usuario (Feedback Visual)
```

### Patrones Utilizados

1. **Container/Presentational Pattern**
   - `PuntoDeVentaView` es el container (orquestador)
   - `CajaSection` y `VentasSection` son containers intermedios
   - Componentes como `CajaEstado`, `ProductosGrid` son presentacionales

2. **Custom Hooks Pattern**
   - Toda la lógica de estado encapsulada en hooks
   - Hooks reutilizables y testeables
   - Separación clara entre lógica y presentación

3. **Service Layer Pattern**
   - Capa de servicios para todas las llamadas API
   - Transformación de datos centralizada
   - Manejo de errores consistente

---

## 📝 Tipos e Interfaces

### Ubicación: `types/index.ts`

#### Productos

```typescript
interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  codigo_producto: string;
  precio?: number;
  controla_stock?: boolean;
  categorias?: Array<{ id: number; nombre: string }>;
  puntos_venta?: Array<{ id: number; nombre: string }>;
}

interface ProductoPrecioItem {
  lista_precio_id: number;
  nombre_lista: string;
  precio_unitario: string;
}

interface ProductoPreciosResponse {
  precios: ProductoPrecioItem[];
}
```

#### Clientes y Afiliados

```typescript
interface ClienteData {
  titular: Titular;
  familiares?: Familiar[];
}

interface Titular {
  id_titular: string;              // id_afiliado del titular
  id_cliente_titular: string;      // cliente UUID del titular
  nombre_titular: string;
  apellido_titular: string;
  dni_titular: string;
  convenio: string;
  compro_hoy?: boolean;            // Indica si ya compró/ingresó hoy
}

interface Familiar {
  id_familiar: string;             // id_afiliado del familiar
  id_cliente_familiar: string;     // cliente UUID del familiar
  nombre_familiar: string;
  apellido_familiar: string;
  dni_familiar: string;
  relacion: string;
  edad_categoria: "mayor" | "menor";
  compro_hoy?: boolean;
}
```

#### Detalle de Venta

```typescript
interface DetalleItem {
  id: string;                      // ID único para el item
  productoId: number;
  productoNombre: string;
  listaPrecioId: number;
  nombreLista: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  // Campos adicionales para entradas de socio
  afiliadoId?: string | null;      // id_afiliado si es entrada de socio
  esTitular?: boolean;             // true solo si es el titular
  dniPersona?: string;             // DNI de la persona
}

interface MedioPago {
  id: number;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

#### Precios de Entrada

```typescript
interface PreciosEntrada {
  precioEntradaNoSocio: number | null;
  productoEntradaId: number | null;
  productoEntradaMayorId: number | null;
  productoEntradaMenorId: number | null;
  precioEntradaMayor: number | null;
  precioEntradaMenor: number | null;
  listaPrecioIdSocio: number;      // Por defecto id 1, cambia a 2 si es empleado
}
```

---

## 🔧 Servicios

### Ubicación: `services/`

Los servicios son funciones puras que manejan las llamadas a la API y la transformación de datos.

### `productosService.ts`

**Funciones:**
- `getProductos(puntoVentaId: number): Promise<Producto[]>`
  - Obtiene productos disponibles para un punto de venta
  - Filtra por `puntosVenta` en los parámetros de la API

- `getProductoPrecios(productoId: number): Promise<ProductoPreciosResponse>`
  - Obtiene todas las listas de precios de un producto

- `findProductosEntrada(productos: Producto[]): { productoEntrada, productoEntradaMayor, productoEntradaMenor }`
  - Busca productos de entrada en una lista de productos
  - Identifica por nombre (contiene "entrada", "mayor", "menor")

**Ejemplo:**
```typescript
import { getProductos, findProductosEntrada } from './services';

const productos = await getProductos(puntoVentaId);
const { productoEntrada, productoEntradaMayor } = findProductosEntrada(productos);
```

### `clienteService.ts`

**Funciones:**
- `buscarAfiliadoPorDni(dni: string): Promise<AfiliadoResponse>`
  - Busca un afiliado por DNI
  - Retorna "CF" (Consumidor Final) si no es afiliado

- `mapAfiliadoToClienteData(afiliado: AfiliadoResponse): ClienteData`
  - Transforma la respuesta del backend a la estructura `ClienteData`
  - Mapea titular y familiares

**Ejemplo:**
```typescript
import { buscarAfiliadoPorDni, mapAfiliadoToClienteData } from './services';

const afiliado = await buscarAfiliadoPorDni('12345678');
if (afiliado.id_afiliado !== 'CF') {
  const clienteData = mapAfiliadoToClienteData(afiliado);
}
```

### `ventaService.ts`

**Funciones:**
- `getMediosPago(): Promise<MedioPago[]>`
  - Obtiene los medios de pago disponibles

- `crearVenta(payload: VentaPayload): Promise<VentaResponse>`
  - Crea una nueva venta en el backend

- `construirVentaPayload(...): VentaPayload`
  - Construye el payload para crear una venta
  - Separa entradas de socio de entradas extra
  - Agrupa entradas extra por producto

**Ejemplo:**
```typescript
import { crearVenta, construirVentaPayload } from './services';

const payload = construirVentaPayload(
  clienteId,
  puntoVentaId,
  metodoPagoId,
  detalleItems,
  isConsumidorFinal
);
const venta = await crearVenta(payload);
```

### `preciosEntradaService.ts`

**Funciones:**
- `loadPrecioEntradaNoSocio(productoId: number): Promise<number | null>`
  - Carga el precio de entrada para no afiliados
  - Busca la lista de precios que contiene "no afiliado"

- `loadPrecioEntradaSocio(productoId: number, tipo: "mayor" | "menor", convenioNombre: string): Promise<{ precio, listaPrecioId } | null>`
  - Carga el precio de entrada para socios
  - Determina la lista de precios según el convenio (empleado = id 2, otros = id 1)

---

## 🎣 Hooks Personalizados

### Ubicación: `hooks/`

Los hooks encapsulan la lógica de estado y efectos de React.

### `useProductos`

**Propósito**: Gestiona la carga y estado de productos

**Parámetros:**
- `puntoVentaId: number | undefined`

**Retorna:**
```typescript
{
  productos: Producto[];
  isLoading: boolean;
  error: string | null;
  productosEntrada: {
    productoEntrada: Producto | null;
    productoEntradaMayor: Producto | null;
    productoEntradaMenor: Producto | null;
  };
}
```

**Uso:**
```typescript
const { productos, isLoading, productosEntrada } = useProductos(puntoVentaId);
```

### `useCliente`

**Propósito**: Gestiona la búsqueda y selección de clientes/afiliados

**Retorna:**
```typescript
{
  dni: string;
  setDni: (dni: string) => void;
  clienteData: ClienteData | null;
  clienteId: string | null;
  isLoading: boolean;
  isConsumidorFinal: boolean;
  familiaresSeleccionados: Set<string>;
  setFamiliaresSeleccionados: (set: Set<string>) => void;
  loadClienteByDni: (dni: string) => Promise<void>;
  toggleFamiliar: (key: string) => void;
  clearCliente: () => void;
}
```

**Características:**
- Auto-selecciona el titular o familiar si el DNI coincide
- Maneja el caso de "Consumidor Final"
- Gestiona la selección de familiares con un `Set<string>`

**Uso:**
```typescript
const {
  dni,
  setDni,
  clienteData,
  loadClienteByDni,
  toggleFamiliar,
  isConsumidorFinal
} = useCliente();
```

### `usePreciosEntrada`

**Propósito**: Gestiona los precios de entrada (afiliado/no afiliado, mayor/menor)

**Retorna:**
```typescript
{
  precios: PreciosEntradaState;
  setProductoEntradaId: (id: number | null) => void;
  setProductoEntradaMayorId: (id: number | null) => void;
  setProductoEntradaMenorId: (id: number | null) => void;
  loadPrecioNoSocio: (productoId: number) => Promise<void>;
  loadPreciosSocio: (clienteData: ClienteData | null) => Promise<void>;
  clearPrecios: () => void;
}
```

**Uso:**
```typescript
const {
  precios,
  loadPrecioNoSocio,
  loadPreciosSocio
} = usePreciosEntrada();

// Cargar precio no afiliado
await loadPrecioNoSocio(productoEntradaId);

// Cargar precios socio (mayor y menor)
await loadPreciosSocio(clienteData);
```

### `useDetalleVenta`

**Propósito**: Gestiona los items del detalle de venta (carrito)

**Parámetros:**
- `clienteData: ClienteData | null`
- `familiaresSeleccionados: Set<string>`
- `precios: PreciosEntradaState`

**Retorna:**
```typescript
{
  detalleItems: DetalleItem[];
  agregarItem: (item: DetalleItem) => void;
  agregarItems: (items: DetalleItem[]) => void;
  eliminarItem: (itemId: string) => void;
  limpiarDetalle: () => void;
  calcularTotal: () => number;
}
```

**Características Especiales:**
- **Sincronización automática**: Las entradas de socio se crean/eliminan automáticamente según los familiares seleccionados
- **Cálculo de precios**: Determina el precio según el tipo de cliente y edad
- **IDs únicos**: Genera IDs únicos para cada item

**Uso:**
```typescript
const {
  detalleItems,
  agregarItems,
  eliminarItem,
  limpiarDetalle
} = useDetalleVenta(clienteData, familiaresSeleccionados, precios);
```

### `useVenta`

**Propósito**: Gestiona el proceso completo de venta

**Retorna:**
```typescript
{
  mediosPago: MedioPago[];
  isLoadingMediosPago: boolean;
  metodoPagoId: number | null;
  setMetodoPagoId: (id: number) => void;
  isProcesandoVenta: boolean;
  showVentaExitoModal: boolean;
  showVentaErrorModal: boolean;
  ventaErrorMessage: string;
  procesarVenta: (
    clienteId: string,
    clienteData: ClienteData | null,
    dni: string,
    detalleItems: DetalleItem[],
    puntoDeVenta: PuntoDeVenta,
    isConsumidorFinal: boolean,
    refreshCajaEstado: () => Promise<void>
  ) => Promise<void>;
  cerrarModalExito: () => void;
  cerrarModalError: () => void;
}
```

**Flujo de `procesarVenta`:**
1. Valida que haya método de pago seleccionado
2. Construye el payload con `construirVentaPayload`
3. Crea la venta en el backend
4. Genera el recibo PDF con `generateRecibo`
5. Refresca el estado de la caja
6. Muestra modal de éxito o error

**Uso:**
```typescript
const {
  mediosPago,
  metodoPagoId,
  setMetodoPagoId,
  procesarVenta,
  isProcesandoVenta
} = useVenta();

await procesarVenta(
  clienteId,
  clienteData,
  dni,
  detalleItems,
  puntoDeVenta,
  isConsumidorFinal,
  refreshCajaEstado
);
```

### `useCajaActions`

**Propósito**: Gestiona las acciones de abrir/cerrar caja

**Parámetros:**
- `currentPv: PuntoDeVenta | undefined`

**Retorna:**
```typescript
{
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
```

**Características:**
- Maneja el flujo completo de confirmación (pending → success/error)
- Gestiona la animación de cierre del modal
- Refresca el estado de la caja después de abrir/cerrar

### `useMovimientos`

**Propósito**: Gestiona los movimientos de efectivo (ingresos/retiros)

**Retorna:**
```typescript
{
  showMovimientoModal: boolean;
  movimientoTipo: "ingreso" | "retiro" | null;
  monto: string;
  descripcion: string;
  loading: boolean;
  abrirModalMovimiento: (tipo: "ingreso" | "retiro") => void;
  cerrarModalMovimiento: () => void;
  setMonto: (monto: string) => void;
  setDescripcion: (descripcion: string) => void;
  confirmarMovimiento: (cajaId: number, onSuccess?: () => void) => Promise<void>;
}
```

### `useMovimientosCaja`

**Propósito**: Obtiene y gestiona los movimientos de una caja

**Parámetros:**
- `cajaId: number | null`

**Retorna:**
```typescript
{
  movimientos: MovimientoCaja[];
  ingresos: number;
  egresos: number;
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

**Características:**
- Sistema de invalidación global: cuando se crea un movimiento, todos los hooks que usan `useMovimientosCaja` se refrescan automáticamente
- Calcula ingresos, egresos y total automáticamente
- Ordena movimientos de más nuevos a más viejos

**Función de invalidación:**
```typescript
import { invalidateMovimientosCaja } from './hooks';

// Después de crear un movimiento
invalidateMovimientosCaja(cajaId); // Refresca todos los hooks
```

---

## 🧩 Componentes

### Componentes de Caja (`components/caja/`)

#### `CajaSection`

**Nuevo componente** que agrupa toda la sección de caja.

**Props:** Ninguna (usa el contexto directamente)

**Incluye:**
- Selector de punto de venta
- Estado de la caja
- Controles de caja
- Modales de confirmación y movimientos

**Uso:**
```tsx
<CajaSection />
```

#### `CajaEstado`

Muestra el estado actual de la caja (abierta/cerrada) y resumen de movimientos.

**Props:**
```typescript
{
  cajaAbierta: boolean;
  cajaId: number | null;
}
```

#### `CajaControls`

Botones para abrir/cerrar caja e ingresar/retirar efectivo.

**Props:**
```typescript
{
  cajaAbierta: boolean;
  currentPv: PuntoDeVenta | undefined;
  user: any;
  onAbrirCaja: () => void;
  onCerrarCaja: () => void;
  onIngresarEfectivo: () => void;
  onRetirarEfectivo: () => void;
}
```

#### `CajaResumen`

Resumen de ingresos, egresos y total de la caja.

**Props:**
```typescript
{
  cajaId: number | null;
}
```

#### `CajaMovimientos`

Lista de movimientos de la caja con paginación.

**Props:**
```typescript
{
  cajaId: number | null;
}
```

#### `MovimientoModal`

Modal para ingresar o retirar efectivo.

**Props:**
```typescript
{
  show: boolean;
  tipo: "ingreso" | "retiro" | null;
  monto: string;
  descripcion: string;
  loading: boolean;
  puntoDeVenta: PuntoDeVenta | undefined;
  onMontoChange: (monto: string) => void;
  onDescripcionChange: (descripcion: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}
```

### Componentes de Venta (`components/venta/`)

#### `VentasSection`

**Nuevo componente** que agrupa toda la sección de ventas.

**Props:**
```typescript
{
  currentPv: PuntoDeVenta | undefined;
}
```

**Incluye:**
- Formulario de cliente
- Grid de productos
- Detalle de venta
- Modales de precios, éxito y error
- Spinner de procesamiento

**Uso:**
```tsx
<VentasSection currentPv={currentPv} />
```

#### `PuntoDeVentaSelector`

Selector dropdown para cambiar el punto de venta activo.

**Props:**
```typescript
{
  puntosDeVenta: PuntoDeVenta[];
  selectedPuntoDeVentaId: string;
  onPuntoDeVentaChange: (pvId: string) => void;
}
```

**Características:**
- Cierra automáticamente al hacer clic fuera (click outside)
- Usa `useRef` y `useEffect` para manejar eventos

#### `DetalleVenta`

Panel lateral que muestra el detalle de la venta, métodos de pago y botón de cobrar.

**Props:**
```typescript
{
  detalleItems: DetalleItem[];
  mediosPago: MedioPago[];
  isLoadingMediosPago: boolean;
  metodoPagoId: number | null;
  onMetodoPagoChange: (id: number) => void;
  onEliminarItem: (itemId: string) => void;
  onEliminarEntradaSocio: (dni: string) => void;
  onCobrar: () => void;
  isProcesandoVenta: boolean;
  clienteData: ClienteData | null;
  isConsumidorFinal: boolean;
  dni: string;
  familiaresSeleccionados: Set<string>;
}
```

**Características:**
- Muestra el total calculado
- Valida que se pueda cobrar (cliente, items, método de pago)
- Muestra mensajes de validación

### Componentes de Cliente (`components/cliente/`)

#### `ClienteForm`

Formulario para buscar clientes por DNI y seleccionar familiares.

**Props:**
```typescript
{
  dni: string;
  onDniChange: (dni: string) => void;
  onBuscar: () => void;
  isLoading: boolean;
  clienteData: ClienteData | null;
  isConsumidorFinal: boolean;
  familiaresSeleccionados: Set<string>;
  onToggleFamiliar: (key: string) => void;
}
```

**Características:**
- Búsqueda por Enter o botón
- Muestra indicador de "No Afiliado" si es consumidor final
- Muestra indicador de "Ya ingresó" si el titular/familiar ya compró hoy
- Resumen de personas seleccionadas

### Componentes de Producto (`components/producto/`)

#### `ProductosGrid`

Grid que muestra los productos disponibles.

**Props:**
```typescript
{
  productos: Producto[];
  isLoading: boolean;
  onProductoClick: (producto: Producto) => void;
}
```

**Características:**
- Grid responsive (2-5 columnas según tamaño de pantalla)
- Placeholder de imagen
- Loading state

#### `ProductoPreciosModal`

Modal para seleccionar cantidad y lista de precios al agregar un producto.

**Props:**
```typescript
{
  show: boolean;
  producto: Producto | null;
  onClose: () => void;
  onAgregar: (items: Array<{
    listaPrecioId: number;
    cantidad: number;
    precio: number;
    nombreLista: string;
  }>) => void;
}
```

**Características:**
- Permite seleccionar múltiples listas de precios
- Input de cantidad por lista
- Muestra el precio unitario de cada lista

---

## 🖥️ Vistas Principales

### `PuntoDeVentaView`

**Ubicación**: `PuntoDeVentaView.tsx`

**Propósito**: Vista principal del punto de venta. Orquesta todos los componentes.

**Estructura:**
```tsx
<section>
  <CajaSection />
  {cajaAbierta && <VentasSection currentPv={currentPv} />}
</section>
```

**Responsabilidades:**
- Obtener el punto de venta actual del contexto
- Renderizar `CajaSection` siempre
- Renderizar `VentasSection` solo si la caja está abierta

**Líneas de código**: ~30 (reducido de 400+)

### `CajaView` (No Utilizado)

**Ubicación**: `_unused/CajaView.tsx`

**Estado**: No se usa actualmente, pero se mantiene para uso futuro.

**Propósito**: Vista dedicada para gestionar la caja (abrir/cerrar, movimientos, resumen).

**Nota**: Si se necesita en el futuro, se puede crear una ruta dedicada y usar este componente.

---

## 🔄 Flujo de Trabajo

### Flujo de Venta Completo

```
1. Usuario accede a la vista de ventas
   ↓
2. Selecciona Punto de Venta (si hay múltiples)
   ↓
3. Abre la Caja
   - Click en "Abrir Caja"
   - Confirmación
   - Caja se abre
   ↓
4. Busca Cliente por DNI
   - Ingresa DNI
   - Click en "Buscar Afiliado"
   - Se carga información del cliente
   ↓
5. Selecciona Familiares (si aplica)
   - Marca checkboxes de familiares que ingresarán
   - Las entradas de socio se agregan automáticamente al detalle
   ↓
6. Agrega Productos
   - Click en producto del grid
   - Selecciona lista de precios y cantidad
   - Click en "Agregar"
   - Producto se agrega al detalle
   ↓
7. Selecciona Método de Pago
   - Click en método de pago
   ↓
8. Procesa la Venta
   - Click en "Cobrar"
   - Validación de datos
   - Envío al backend
   - Generación de recibo PDF
   - Actualización de estado de caja
   - Modal de éxito
   ↓
9. Limpieza
   - Cliente se limpia
   - Detalle se limpia
   - Listo para nueva venta
```

### Flujo de Datos de Entradas de Socio

```
Cliente seleccionado
   ↓
useCliente detecta clienteData
   ↓
usePreciosEntrada carga precios según convenio
   ↓
Usuario selecciona familiares
   ↓
useDetalleVenta detecta cambios en familiaresSeleccionados
   ↓
Sincroniza automáticamente:
   - Elimina entradas de socio anteriores
   - Crea nuevas entradas según familiares seleccionados
   - Calcula precios según edad (mayor/menor)
   - Asigna afiliadoId y esTitular
   ↓
Detalle actualizado en UI
```

### Flujo de Movimientos de Caja

```
Usuario hace click en "Ingresar Efectivo" o "Retirar Efectivo"
   ↓
useMovimientos abre modal
   ↓
Usuario ingresa monto y descripción
   ↓
Usuario confirma
   ↓
useMovimientos llama a la API
   ↓
Movimiento creado
   ↓
invalidateMovimientosCaja(cajaId)
   ↓
Todos los hooks useMovimientosCaja se refrescan automáticamente
   ↓
UI se actualiza (resumen, lista de movimientos)
```

---

## 📖 Guía de Desarrollo

### Agregar un Nuevo Componente

1. **Identificar la categoría**: ¿Es de caja, venta, cliente o producto?
2. **Crear el componente** en la carpeta correspondiente
3. **Definir las props** con TypeScript
4. **Usar los hooks** necesarios para la lógica
5. **Exportar** en `components/index.ts`
6. **Usar** en la vista o sección correspondiente

**Ejemplo:**
```typescript
// components/producto/ProductoCard.tsx
interface ProductoCardProps {
  producto: Producto;
  onClick: () => void;
}

export function ProductoCard({ producto, onClick }: ProductoCardProps) {
  return (
    <button onClick={onClick}>
      <h3>{producto.nombre}</h3>
    </button>
  );
}

// components/index.ts
export { ProductoCard } from "./producto/ProductoCard";
```

### Agregar un Nuevo Hook

1. **Crear el archivo** en `hooks/`
2. **Definir el tipo de retorno** con TypeScript
3. **Usar servicios** para llamadas a API
4. **Exportar** en `hooks/index.ts`
5. **Usar en componentes** o vistas

**Ejemplo:**
```typescript
// hooks/useProductoDetalle.ts
export function useProductoDetalle(productoId: number | null) {
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productoId) return;
    
    setLoading(true);
    getProductoDetalle(productoId)
      .then(setProducto)
      .finally(() => setLoading(false));
  }, [productoId]);

  return { producto, loading };
}

// hooks/index.ts
export { useProductoDetalle } from "./useProductoDetalle";
```

### Agregar un Nuevo Servicio

1. **Crear el archivo** en `services/`
2. **Definir funciones puras** que llamen a la API
3. **Usar tipos** de `types/index.ts`
4. **Manejar errores** apropiadamente
5. **Exportar** en `services/index.ts`

**Ejemplo:**
```typescript
// services/productoDetalleService.ts
import axios from "@/utils/axios";
import { Producto } from "../types";

export async function getProductoDetalle(productoId: number): Promise<Producto> {
  const response = await axios.get<Producto>(`/api/productos/${productoId}`);
  return response.data;
}

// services/index.ts
export { getProductoDetalle } from "./productoDetalleService";
```

### Modificar el Flujo de Venta

1. **Identificar el punto de modificación** en el flujo
2. **Revisar los hooks relacionados** (`useVenta`, `useDetalleVenta`)
3. **Revisar los servicios relacionados** (`ventaService`)
4. **Actualizar tipos** si es necesario (`types/index.ts`)
5. **Actualizar componentes** si afecta la UI

### Mejores Prácticas

1. **Siempre usar TypeScript**: Define tipos para props, retornos, etc.
2. **Separar lógica de presentación**: Hooks para lógica, componentes para UI
3. **Reutilizar hooks**: No duplicar lógica entre componentes
4. **Manejar estados de carga**: Siempre mostrar feedback al usuario
5. **Manejar errores**: Capturar y mostrar errores apropiadamente
6. **Usar archivos de barril**: Facilita las importaciones
7. **Documentar componentes complejos**: Comentarios JSDoc para funciones/hooks importantes

---

## 🔍 Notas Importantes

### Entradas de Socio vs Entradas Extra

- **Entradas de Socio**: 
  - Se crean automáticamente cuando se seleccionan familiares
  - Tienen `afiliadoId` (no null) y `esTitular` (true/false)
  - El ID del item comienza con `"entrada-socio-"`
  - Se incluyen en el payload como detalles individuales (una por persona)

- **Entradas Extra**: 
  - Se agregan manualmente desde el grid de productos
  - Tienen `afiliadoId = null` y `esTitular = false`
  - Se agrupan por producto en el payload (suma de cantidades)

### Consumidor Final

Cuando el DNI corresponde a "Consumidor Final" (`id_afiliado === "CF"`):
- No se muestran familiares
- Todas las entradas se tratan como "extra" (`afiliado_id = null`)
- Se usa el precio de "no afiliado"
- No se requiere seleccionar familiares para cobrar

### Precios de Entrada

- **No Afiliado**: Precio para consumidor final o no afiliados
- **Socio Mayor**: Precio para afiliados mayores de edad
- **Socio Menor**: Precio para afiliados menores de edad
- **Lista de Precios**: 
  - ID 1: Para convenios normales
  - ID 2: Para convenio "empleado"

### Sincronización Automática

El hook `useDetalleVenta` sincroniza automáticamente las entradas de socio con los familiares seleccionados. **No es necesario agregar/eliminar manualmente estas entradas**.

**Cómo funciona:**
1. El hook observa `clienteData`, `familiaresSeleccionados` y `precios`
2. Cuando cambian, recalcula las entradas de socio
3. Mantiene los items que NO son entradas de socio
4. Reemplaza todas las entradas de socio con nuevas según la selección actual

### Invalidación de Movimientos

El sistema de invalidación permite que múltiples componentes se actualicen automáticamente cuando hay un cambio:

```typescript
// En cualquier lugar del código
import { invalidateMovimientosCaja } from './hooks';

// Después de crear un movimiento
invalidateMovimientosCaja(cajaId);

// Todos los hooks useMovimientosCaja con ese cajaId se refrescan
```

---

## 🐛 Troubleshooting

### La caja no se abre

**Posibles causas:**
- El punto de venta no está seleccionado
- El usuario no está autenticado
- Error en la API

**Solución:**
1. Verificar que el punto de venta esté seleccionado
2. Verificar que el usuario esté autenticado
3. Revisar la consola para errores de API
4. Verificar la conexión con el backend

### Los productos no se cargan

**Posibles causas:**
- El punto de venta no tiene productos asignados
- Error en la API
- Problema de conexión

**Solución:**
1. Verificar que el punto de venta tenga productos asignados
2. Revisar la consola para errores de API
3. Verificar la conexión con el backend
4. Verificar los parámetros de la petición

### Las entradas de socio no aparecen

**Posibles causas:**
- No se ha seleccionado ningún familiar
- Los precios de entrada no se han cargado
- Error en la sincronización

**Solución:**
1. Verificar que se haya seleccionado al menos un familiar
2. Verificar que los precios de entrada se hayan cargado correctamente
3. Revisar la consola para errores
4. Verificar que los productos de entrada existan

### La venta no se procesa

**Posibles causas:**
- Campos requeridos incompletos
- La caja no está abierta
- Error en la API
- Método de pago no seleccionado

**Solución:**
1. Verificar que todos los campos requeridos estén completos:
   - Cliente seleccionado (o consumidor final)
   - Al menos un item en el detalle
   - Método de pago seleccionado
2. Verificar que la caja esté abierta
3. Revisar la consola para errores de API
4. Verificar el payload que se envía

### Los movimientos no se actualizan

**Posibles causas:**
- No se está llamando a `invalidateMovimientosCaja`
- El `cajaId` es incorrecto
- Error en la API

**Solución:**
1. Verificar que se llame a `invalidateMovimientosCaja(cajaId)` después de crear un movimiento
2. Verificar que el `cajaId` sea correcto
3. Revisar la consola para errores

---

## 📚 Referencias

### Contextos

- **Ventas Context**: `@/app/contexts/ventas/context`
  - Proporciona: `puntosDeVenta`, `selectedPuntoDeVentaId`, `cajaAbierta`, `getCajaId`, etc.

- **Auth Context**: `@/app/contexts/auth/context`
  - Proporciona: `user` (usuario autenticado)

### Utilidades Externas

- **generateRecibo**: `@/utils/generateRecibo`
  - Genera el PDF del recibo de venta

- **axios**: `@/utils/axios`
  - Cliente HTTP configurado con interceptores

### Componentes Compartidos

- **ConfirmModal**: `@/components/shared/ConfirmModal`
  - Modal de confirmación reutilizable

- **Spinner**: `@/components/ui/Spinner`
  - Componente de carga

---

## 🚀 Mejoras Futuras

1. **CajaView**: Implementar ruta dedicada para gestión de caja (`/ventas/caja`)
2. **Filtros de Productos**: Agregar filtros por categoría
3. **Búsqueda de Productos**: Agregar búsqueda por nombre/código
4. **Historial de Ventas**: Vista para ver ventas anteriores
5. **Descuentos**: Sistema de descuentos por producto o cliente
6. **Múltiples Métodos de Pago**: Permitir dividir el pago entre varios métodos
7. **Impresión Directa**: Opción para imprimir recibo directamente
8. **Modo Offline**: Cachear datos para trabajar sin conexión
9. **Notificaciones**: Sistema de notificaciones para eventos importantes
10. **Analytics**: Dashboard con estadísticas de ventas

---

## 📝 Changelog

### Versión 2.0 (Reestructuración - Diciembre 2024)

**Cambios principales:**
- ✅ Reestructuración completa del módulo
- ✅ `PuntoDeVentaView` reducido de 400+ a ~30 líneas
- ✅ Separación en `CajaSection` y `VentasSection`
- ✅ Eliminación de componentes duplicados
- ✅ Archivos de barril para exports organizados
- ✅ Archivos no usados movidos a `_unused/`
- ✅ Documentación completa actualizada

**Mejoras:**
- Código más mantenible y fácil de entender
- Mejor separación de responsabilidades
- Facilita el testing y la extensión

---

**Última actualización**: Diciembre 2024  
**Versión**: 2.0 (Reestructurado)  
**Mantenido por**: Equipo de Desarrollo
