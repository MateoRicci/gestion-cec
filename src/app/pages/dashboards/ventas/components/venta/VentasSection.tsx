/**
 * Componente que agrupa toda la sección de ventas (cliente, productos, detalle)
 */
import { useState, useEffect } from "react";
import { useVentasContext } from "@/app/contexts/ventas/context";
import { useProductos } from "../../hooks/useProductos";
import { useCliente } from "../../hooks/useCliente";
import { usePreciosEntrada } from "../../hooks/usePreciosEntrada";
import { useDetalleVenta } from "../../hooks/useDetalleVenta";
import { useVenta } from "../../hooks/useVenta";
import { invalidateVentasCaja } from "../../hooks/useVentasCaja";
import { ProductoPreciosModal } from "../producto/ProductoPreciosModal";
import { ClienteForm } from "../cliente/ClienteForm";
import { ProductosGrid } from "../producto/ProductosGrid";
import { DetalleVenta } from "./DetalleVenta";
import { CajaVentas } from "../caja/CajaVentas";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Spinner } from "@/components/ui/Spinner";
import { Producto, DetalleItem } from "../../types";
import { PuntoDeVenta } from "@/app/contexts/ventas/context";

interface VentasSectionProps {
  currentPv: PuntoDeVenta | undefined;
}

export function VentasSection({ currentPv }: VentasSectionProps) {
  const { refreshCajaEstado, getCajaId } = useVentasContext();
  
  const cajaId = currentPv ? getCajaId(currentPv.id.toString()) : null;
  
  // Estado para modal de ventas
  const [showVentasModal, setShowVentasModal] = useState(false);

  // Hooks de productos
  const { productos, isLoading: isLoadingProductos, productosEntrada } =
    useProductos(currentPv?.id);

  // Hook de precios de entrada
  const {
    precios,
    setProductoEntradaId,
    setProductoEntradaMayorId,
    setProductoEntradaMenorId,
    loadPrecioNoSocio,
    loadPreciosSocio,
  } = usePreciosEntrada();

  // Configurar IDs de productos de entrada cuando se cargan
  useEffect(() => {
    if (productosEntrada.productoEntrada) {
      setProductoEntradaId(productosEntrada.productoEntrada.id);
      loadPrecioNoSocio(productosEntrada.productoEntrada.id);
    }
    if (productosEntrada.productoEntradaMayor) {
      setProductoEntradaMayorId(productosEntrada.productoEntradaMayor.id);
    }
    if (productosEntrada.productoEntradaMenor) {
      setProductoEntradaMenorId(productosEntrada.productoEntradaMenor.id);
    }
  }, [
    productosEntrada.productoEntrada?.id,
    productosEntrada.productoEntradaMayor?.id,
    productosEntrada.productoEntradaMenor?.id,
    setProductoEntradaId,
    setProductoEntradaMayorId,
    setProductoEntradaMenorId,
    loadPrecioNoSocio,
  ]);

  // Hook de cliente
  const {
    dni,
    setDni,
    clienteData,
    clienteId,
    isLoading: isLoadingCliente,
    isConsumidorFinal,
    familiaresSeleccionados,
    setFamiliaresSeleccionados,
    loadClienteByDni,
    toggleFamiliar,
    clearCliente,
  } = useCliente();

  // Cargar precios de socio cuando cambia el cliente
  useEffect(() => {
    if (clienteData && !isConsumidorFinal) {
      loadPreciosSocio(clienteData);
    }
  }, [clienteData, isConsumidorFinal, loadPreciosSocio]);

  // Hook de detalle de venta
  const {
    detalleItems,
    agregarItems,
    eliminarItem,
    limpiarDetalle,
  } = useDetalleVenta(clienteData, familiaresSeleccionados, precios);

  // Hook de venta
  const {
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
  } = useVenta();

  // Estado para modales
  const [showPreciosModal, setShowPreciosModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);

  // Manejar click en producto
  const handleProductoClick = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setShowPreciosModal(true);
  };

  // Manejar agregar producto al detalle
  const handleAgregarProducto = (
    items: Array<{
      listaPrecioId: number;
      cantidad: number;
      precio: number;
      nombreLista: string;
    }>
  ) => {
    if (!productoSeleccionado) return;

    const nuevosItems: DetalleItem[] = items.map((item, index) => ({
      id: `${productoSeleccionado.id}-${item.listaPrecioId}-${Date.now()}-${index}`,
      productoId: productoSeleccionado.id,
      productoNombre: productoSeleccionado.nombre,
      listaPrecioId: item.listaPrecioId,
      nombreLista: item.nombreLista,
      cantidad: item.cantidad,
      precio: item.precio,
      subtotal: item.precio * item.cantidad,
      afiliadoId: null,
      esTitular: false,
    }));

    agregarItems(nuevosItems);
  };

  // Manejar eliminar entrada de socio
  const handleEliminarEntradaSocio = (dni: string) => {
    setFamiliaresSeleccionados((prev) => {
      const newSeleccionados = new Set(prev);
      newSeleccionados.delete(`titular-${dni}`);
      newSeleccionados.delete(`familiar-${dni}`);
      return newSeleccionados;
    });
  };

  // Manejar cobrar
  const handleCobrar = async () => {
    // Validaciones
    if (!currentPv) {
      console.error("No hay punto de venta seleccionado");
      return;
    }
    
    if (!clienteId && !isConsumidorFinal) {
      console.error("No hay cliente seleccionado y no es consumidor final");
      return;
    }
    
    if (detalleItems.length === 0) {
      console.error("No hay items en el detalle");
      return;
    }
    
    if (!metodoPagoId) {
      console.error("No hay método de pago seleccionado");
      return;
    }

    // Si es consumidor final, usar el DNI como clienteId si no hay clienteId
    const clienteIdFinal = clienteId || (isConsumidorFinal ? dni : null);
    
    if (!clienteIdFinal) {
      console.error("No se puede determinar el clienteId");
      return;
    }

    try {
      await procesarVenta(
        clienteIdFinal,
        clienteData,
        dni,
        detalleItems,
        currentPv,
        isConsumidorFinal,
        refreshCajaEstado
      );

      // Invalidar ventas de caja para refrescar el listado
      const cajaId = currentPv ? getCajaId(currentPv.id.toString()) : null;
      if (cajaId) {
        invalidateVentasCaja(cajaId);
      }

      // Limpiar formulario después de cobrar exitosamente
      clearCliente();
      limpiarDetalle();
    } catch (error) {
      console.error("Error al procesar venta:", error);
    }
  };

  // Cerrar modal de éxito y limpiar
  const handleCerrarModalExito = () => {
    cerrarModalExito();
  };

  // Manejar restablecer venta (limpiar detalle, cliente y método de pago)
  const handleRestablecer = () => {
    limpiarDetalle();
    clearCliente();
    setMetodoPagoId(null);
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Ventas
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-200">
            Gestiona las ventas del punto de venta seleccionado.
          </p>
        </div>
        
        {/* Botón Ver Ventas */}
        {cajaId && (
          <button
            type="button"
            onClick={() => setShowVentasModal(true)}
            className="inline-flex items-center rounded-md border border-emerald-500 px-3 py-1.5 text-xs font-medium text-emerald-500 transition hover:bg-emerald-500/10"
          >
            Ver ventas
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Columna izquierda: Formulario, categorías y productos */}
        <div className="flex-1 space-y-6">
          <ClienteForm
            dni={dni}
            onDniChange={setDni}
            onBuscar={() => loadClienteByDni(dni)}
            isLoading={isLoadingCliente}
            clienteData={clienteData}
            isConsumidorFinal={isConsumidorFinal}
            familiaresSeleccionados={familiaresSeleccionados}
            onToggleFamiliar={toggleFamiliar}
          />

          <ProductosGrid
            productos={productos}
            isLoading={isLoadingProductos}
            onProductoClick={handleProductoClick}
          />
        </div>

        {/* Columna derecha: Detalle de Venta */}
        <DetalleVenta
          detalleItems={detalleItems}
          mediosPago={mediosPago}
          isLoadingMediosPago={isLoadingMediosPago}
          metodoPagoId={metodoPagoId}
          onMetodoPagoChange={setMetodoPagoId}
          onEliminarItem={eliminarItem}
          onEliminarEntradaSocio={handleEliminarEntradaSocio}
          onCobrar={handleCobrar}
          isProcesandoVenta={isProcesandoVenta}
          clienteData={clienteData}
          isConsumidorFinal={isConsumidorFinal}
          dni={dni}
          familiaresSeleccionados={familiaresSeleccionados}
          onRestablecer={handleRestablecer}
        />
      </div>

      {/* Modal de Listas de Precios */}
      <ProductoPreciosModal
        show={showPreciosModal}
        producto={productoSeleccionado}
        onClose={() => {
          setShowPreciosModal(false);
          setProductoSeleccionado(null);
        }}
        onAgregar={handleAgregarProducto}
      />

      {/* Modal de Venta Exitosa */}
      <ConfirmModal
        show={showVentaExitoModal}
        onClose={handleCerrarModalExito}
        onOk={handleCerrarModalExito}
        state="success"
        confirmLoading={false}
        messages={{
          success: {
            title: "Venta realizada exitosamente",
            description:
              "La venta se ha procesado correctamente y el recibo se ha generado.",
            actionText: "Aceptar",
          },
        }}
      />

      {/* Modal de Error en Venta */}
      <ConfirmModal
        show={showVentaErrorModal}
        onClose={cerrarModalError}
        onOk={cerrarModalError}
        state="error"
        confirmLoading={false}
        messages={{
          error: {
            title: "Error al procesar la venta",
            description: ventaErrorMessage,
            actionText: "Cerrar",
          },
        }}
      />

      {/* Modal de Procesando Venta */}
      {isProcesandoVenta && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-xl dark:border-dark-600 dark:bg-dark-800">
            <div className="flex flex-col items-center gap-4">
              <Spinner color="primary" className="size-12" />
              <p className="text-lg font-semibold text-gray-900 dark:text-dark-50">
                Procesando venta...
              </p>
              <p className="text-sm text-gray-500 dark:text-dark-400">
                Por favor, espera un momento
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ventas */}
      {showVentasModal && cajaId && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-lg border border-gray-700 bg-gray-900 p-5 text-gray-100 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Ventas de caja</h3>
              <button
                type="button"
                onClick={() => setShowVentasModal(false)}
                className="text-sm text-gray-400 hover:text-gray-200"
              >
                Cerrar
              </button>
            </div>

            {/* Headers de la tabla */}
            <div className="mb-3 grid grid-cols-12 gap-4 border-b border-gray-700/50 pb-2 text-xs font-semibold text-gray-400">
              <div className="col-span-2">Monto</div>
              <div className="col-span-3">Cliente</div>
              <div className="col-span-2">Entradas</div>
              <div className="col-span-3">Convenio</div>
              <div className="col-span-2">Fecha</div>
            </div>

            <CajaVentas cajaId={cajaId} />
          </div>
        </div>
      )}
    </>
  );
}

