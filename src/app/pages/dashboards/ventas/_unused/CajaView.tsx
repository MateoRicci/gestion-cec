/**
 * @deprecated Este componente no se está utilizando actualmente.
 * Se mantiene aquí por si se necesita en el futuro para una vista dedicada de caja.
 * 
 * La funcionalidad de caja está integrada en PuntoDeVentaView a través de CajaSection.
 */
import { useVentasContext } from "@/app/contexts/ventas/context";
import { useAuthContext } from "@/app/contexts/auth/context";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { useCajaActions } from "../hooks/useCajaActions";
import { useMovimientos } from "../hooks/useMovimientos";
import { invalidateMovimientosCaja } from "../hooks/useMovimientosCaja";
// import { CajaHeader } from "../components/caja/CajaHeader"; // Componente no existe
import { CajaEstado } from "../components/caja/CajaEstado";
import { CajaControls } from "../components/caja/CajaControls";
import { CajaResumen } from "../components/caja/CajaResumen";
import { CajaMovimientos } from "../components/caja/CajaMovimientos";
import { MovimientoModal } from "../components/caja/MovimientoModal";

export function CajaView() {
  const {
    puntosDeVenta,
    selectedPuntoDeVentaId,
    cajaAbierta,
    isLoadingCaja,
    getCajaId,
  } = useVentasContext();
  const { user } = useAuthContext();

  const currentPv =
    puntosDeVenta.find((pv) => pv.id.toString() === selectedPuntoDeVentaId) ||
    puntosDeVenta[0];

  const cajaId = currentPv
    ? getCajaId(currentPv.id.toString())
    : null;

  // Hook para manejar acciones de abrir/cerrar caja
  const {
    showConfirmModal,
    confirmLoading,
    confirmState,
    solicitarAbrirCaja,
    solicitarCerrarCaja,
    confirmarAccion,
    getConfirmMessages,
    closeConfirmModal,
  } = useCajaActions(currentPv);

  // Hook para manejar movimientos de efectivo
  const {
    showMovimientoModal,
    movimientoTipo,
    monto,
    descripcion,
    loading: movimientoLoading,
    abrirModalMovimiento,
    cerrarModalMovimiento,
    setMonto,
    setDescripcion,
    confirmarMovimiento,
  } = useMovimientos();

  const handleConfirmarMovimiento = async () => {
    if (!cajaId) {
      console.error("No hay caja abierta");
      return;
    }

    try {
      await confirmarMovimiento(cajaId, () => {
        // Invalidar y refrescar todos los componentes que usan movimientos de caja
        invalidateMovimientosCaja(cajaId);
      });
    } catch (error) {
      // El error ya se maneja en el hook
      console.error("Error al confirmar movimiento:", error);
    }
  };

  return (
    <section className="flex-1 pt-2">
      <div className="flex flex-col gap-5">
        <div className="flex justify-between gap-10">
          {/* Columna izquierda: controles de caja */}
          <div className="flex-1">
            {/* CajaHeader removido - componente no existe */}
            {/* <CajaHeader
              puntosDeVenta={puntosDeVenta}
              selectedPuntoDeVentaId={selectedPuntoDeVentaId}
              onPuntoDeVentaChange={setSelectedPuntoDeVentaId}
            /> */}

            {isLoadingCaja ? (
              <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 dark:text-dark-200">
                <div className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Cargando estado de la caja...</span>
              </div>
            ) : (
              <>
                <CajaEstado cajaAbierta={cajaAbierta} cajaId={cajaId} />

                <CajaControls
                  cajaAbierta={cajaAbierta}
                  currentPv={currentPv}
                  user={user}
                  onAbrirCaja={solicitarAbrirCaja}
                  onCerrarCaja={solicitarCerrarCaja}
                  onIngresarEfectivo={() => abrirModalMovimiento("ingreso")}
                  onRetirarEfectivo={() => abrirModalMovimiento("retiro")}
                />
              </>
            )}
          </div>

          {/* Columna derecha: resumen de caja */}
          <CajaResumen cajaId={cajaId} />
        </div>

        {/* Sección de movimientos a todo el ancho */}
        <CajaMovimientos cajaId={cajaId} />
      </div>

      {/* Modal para ingresar / retirar efectivo */}
      <MovimientoModal
        show={showMovimientoModal}
        tipo={movimientoTipo}
        monto={monto}
        descripcion={descripcion}
        loading={movimientoLoading}
        puntoDeVenta={currentPv}
        onMontoChange={setMonto}
        onDescripcionChange={setDescripcion}
        onCancel={cerrarModalMovimiento}
        onConfirm={handleConfirmarMovimiento}
      />

      {/* Modal de confirmación para abrir/cerrar caja */}
      <ConfirmModal
        show={showConfirmModal}
        onClose={closeConfirmModal}
        onOk={confirmarAccion}
        state={confirmState}
        confirmLoading={confirmLoading}
        messages={getConfirmMessages()}
      />
    </section>
  );
}

