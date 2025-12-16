import { useVentasCaja, VentaCaja } from "../../hooks/useVentasCaja";
import axios from "@/utils/axios";
import { useMovimientosCaja, invalidateMovimientosCaja } from "../../hooks/useMovimientosCaja";
import { memo, useState } from "react";
import {
  ConfirmModal,
  ModalState,
  ConfirmMessages,
} from "@/components/shared/ConfirmModal";

// Formatters creados una vez para mejor rendimiento
const currencyFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

function formatDate(dateString: string): string {
  return dateFormatter.format(new Date(dateString));
}

function VentaItemBase({ venta }: { venta: VentaCaja }) {
  return (
    <div className="grid grid-cols-12 gap-4 border-b border-gray-700/50 py-3 last:border-b-0 items-center">
      {/* Monto */}
      <div className="col-span-2">
        <span className="text-sm font-semibold text-emerald-400 whitespace-nowrap">
          $ {formatCurrency(venta.montoTotal)}
        </span>
      </div>

      {/* Nombre y Apellido */}
      <div className="col-span-3 min-w-0">
        <p className="text-sm font-medium text-gray-100 truncate">
          {venta.clienteNombre} {venta.clienteApellido}
        </p>
      </div>

      {/* Cantidad de entradas */}
      <div className="col-span-2">
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {venta.totalEntradas} {venta.totalEntradas === 1 ? "entrada" : "entradas"}
        </span>
      </div>

      {/* Convenio */}
      <div className="col-span-3">
        <span
          className={`text-xs px-2 py-0.5 rounded whitespace-nowrap inline-block ${
            venta.convenioNombre === "No Afiliado"
              ? "bg-gray-500/20 text-gray-400"
              : "bg-primary-500/20 text-primary-400"
          }`}
        >
          {venta.convenioNombre}
        </span>
      </div>

      {/* Fecha */}
      <div className="col-span-2">
        <p className="text-xs text-gray-500 whitespace-nowrap">
          {formatDate(venta.createdAt)}
        </p>
      </div>
    </div>
  );
}

const VentaItem = memo(VentaItemBase);

interface CajaVentasProps {
  cajaId: number | null;
}

export function CajaVentas({ cajaId }: CajaVentasProps) {
  const { ventas, loading, refetch } = useVentasCaja(cajaId);
  const { refetch: refetchMovimientos } = useMovimientosCaja(cajaId);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmState, setConfirmState] = useState<ModalState>("pending");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaCaja | null>(
    null
  );

  const confirmMessages: ConfirmMessages = {
    pending: {
      title: "¿Anular venta?",
      description:
        "¿Estás seguro de que deseas anular esta venta? Esta acción no puede deshacerse.",
      actionText: "Anular venta",
    },
    success: {
      title: "Venta anulada",
      description: "La venta se anuló correctamente.",
      actionText: "Cerrar",
    },
    error: {
      title: "Error al anular la venta",
      description:
        "No se pudo anular la venta. Verifica tu conexión e intenta nuevamente.",
      actionText: "Reintentar",
    },
  };

  const handleConfirmClose = () => {
    if (confirmLoading) return;
    setShowConfirm(false);
    setConfirmState("pending");
    setVentaSeleccionada(null);
  };

  const handleEliminarVenta = async () => {
    if (!ventaSeleccionada) return;

    try {
      setConfirmLoading(true);
      setConfirmState("pending");

      await axios.patch(`/api/ventas/${ventaSeleccionada.id}/cancelar`);
      // Refrescar ventas y movimientos/saldos
      await Promise.all([refetch(), refetchMovimientos()]);
      // Asegurar que TODOS los hooks de movimientos se actualicen (estado de caja, modal, etc.)
      invalidateMovimientosCaja(cajaId);

      setConfirmState("success");
    } catch (error) {
      console.error("Error al cancelar la venta:", error);
      setConfirmState("error");
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <>
      <div className="max-h-[400px] overflow-y-auto">
      {loading ? (
        <p className="py-4 text-center text-xs text-gray-400">
          Cargando ventas...
        </p>
      ) : ventas.length === 0 ? (
        <p className="py-4 text-center text-xs text-gray-400">
          No hay ventas registradas
        </p>
      ) : (
        <div className="space-y-1">
          {ventas.map((venta) => (
            <div key={venta.id} className="flex items-center justify-between">
              <VentaItem venta={venta} />
              <button
                type="button"
                onClick={() => {
                  setVentaSeleccionada(venta);
                  setConfirmState("pending");
                  setShowConfirm(true);
                }}
                className="ml-3 rounded border border-red-500 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
              >
                Anular venta
              </button>
            </div>
          ))}
        </div>
      )}
      </div>

      <ConfirmModal
        show={showConfirm}
        onClose={handleConfirmClose}
        onOk={handleEliminarVenta}
        state={confirmState}
        confirmLoading={confirmLoading}
        messages={confirmMessages}
      />
    </>
  );
}

