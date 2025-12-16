/**
 * Componente que agrupa toda la sección de caja (estado, controles, selector)
 */
import { useState } from "react";
import { useVentasContext } from "@/app/contexts/ventas/context";
import { useAuthContext } from "@/app/contexts/auth/context";
import { useCajaActions } from "../../hooks/useCajaActions";
import { useMovimientos } from "../../hooks/useMovimientos";
import { invalidateMovimientosCaja } from "../../hooks/useMovimientosCaja";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { MovimientoModal } from "./MovimientoModal";
import { CajaEstado } from "./CajaEstado";
import { CajaControls } from "./CajaControls";
import { CajaMovimientos } from "./CajaMovimientos";
import { PuntoDeVentaSelector } from "../venta/PuntoDeVentaSelector";

interface CajaSectionProps {
  showMovimientos?: boolean;
}

export function CajaSection({ showMovimientos: _showMovimientos = false }: CajaSectionProps) {
  const {
    puntosDeVenta,
    selectedPuntoDeVentaId,
    setSelectedPuntoDeVentaId,
    cajaAbierta,
    isLoadingCaja,
    getCajaId,
  } = useVentasContext();
  const { user } = useAuthContext();

  const currentPv =
    puntosDeVenta.find((pv) => pv.id.toString() === selectedPuntoDeVentaId) ||
    puntosDeVenta[0];
  const cajaId = currentPv ? getCajaId(currentPv.id.toString()) : null;

  // Estados para modales
  const [showMovimientosModal, setShowMovimientosModal] = useState(false);

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
        invalidateMovimientosCaja(cajaId);
      });
    } catch (error) {
      console.error("Error al confirmar movimiento:", error);
    }
  };

  return (
    <>
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-dark-600 dark:bg-dark-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Caja
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-200">
              Abre o cierra la caja para habilitar las ventas.
            </p>
          </div>

          <PuntoDeVentaSelector
            puntosDeVenta={puntosDeVenta}
            selectedPuntoDeVentaId={selectedPuntoDeVentaId}
            onPuntoDeVentaChange={setSelectedPuntoDeVentaId}
          />
        </div>

        {isLoadingCaja ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 dark:text-dark-200">
            <div className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Cargando estado de la caja...</span>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CajaEstado cajaAbierta={cajaAbierta} cajaId={cajaId} />
              </div>

              {/* Botón para ver movimientos */}
              {cajaAbierta && cajaId && (
                <button
                  type="button"
                  onClick={() => setShowMovimientosModal(true)}
                  className="inline-flex items-center rounded-md border border-primary-500 px-3 py-1.5 text-xs font-medium text-primary-500 transition hover:bg-primary-500/10"
                >
                  Ver movimientos
                </button>
              )}
            </div>

            <CajaControls
              cajaAbierta={cajaAbierta}
              currentPv={currentPv}
              user={user}
              onAbrirCaja={solicitarAbrirCaja}
              onCerrarCaja={solicitarCerrarCaja}
              onIngresarEfectivo={() => abrirModalMovimiento("ingreso")}
              onRetirarEfectivo={() => abrirModalMovimiento("retiro")}
            />

            {!cajaAbierta && (
              <p className="mt-3 text-sm text-warning-600 dark:text-warning-400">
                Para realizar ventas, primero debes abrir la caja.
              </p>
            )}
          </>
        )}
      </div>

      {/* Modales de caja / movimientos */}
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

      <ConfirmModal
        show={showConfirmModal}
        onClose={closeConfirmModal}
        onOk={confirmarAccion}
        state={confirmState}
        confirmLoading={confirmLoading}
        messages={getConfirmMessages()}
      />

      {/* Modal de Movimientos */}
      {showMovimientosModal && cajaId && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-lg border border-gray-700 bg-gray-900 p-5 text-gray-100 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Movimientos de caja</h3>
              <button
                type="button"
                onClick={() => setShowMovimientosModal(false)}
                className="text-sm text-gray-400 hover:text-gray-200"
              >
                Cerrar
              </button>
            </div>

            <CajaMovimientos cajaId={cajaId} />
          </div>
        </div>
      )}

    </>
  );
}

