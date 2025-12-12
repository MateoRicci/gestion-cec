import { useMovimientosCaja } from "../hooks/useMovimientosCaja";

interface CajaEstadoProps {
  cajaAbierta: boolean;
  cajaId: number | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function CajaEstado({ cajaAbierta, cajaId }: CajaEstadoProps) {
  const { ingresos, egresos, total } = useMovimientosCaja(cajaId);

  return (
    <div className="mt-6 flex items-start gap-8">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 dark:text-dark-200">
          Estado de la caja:
        </span>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
            cajaAbierta
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-gray-500/10 text-gray-300"
          }`}
        >
          <span
            className={`inline-block size-2 rounded-full ${
              cajaAbierta ? "bg-emerald-400" : "bg-gray-400"
            }`}
          />
          {cajaAbierta ? "Abierta" : "Cerrada"}
        </span>
      </div>

      {cajaAbierta && (
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-dark-200">Ingresos:</span>
            <span className="font-semibold text-emerald-400">
              $ {formatCurrency(ingresos)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-dark-200">Egresos:</span>
            <span className="font-semibold text-red-400">
              $ {formatCurrency(egresos)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-dark-200">Total:</span>
            <span className="font-semibold text-gray-100 dark:text-dark-50">
              $ {formatCurrency(total)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

