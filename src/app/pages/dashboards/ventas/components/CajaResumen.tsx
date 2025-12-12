import { useMovimientosCaja } from "../hooks/useMovimientosCaja";

interface CajaResumenProps {
  cajaId: number | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function CajaResumen({ cajaId }: CajaResumenProps) {
  const { ingresos, egresos, total } = useMovimientosCaja(cajaId);

  return (
    <aside className="w-full max-w-md shrink-0 rounded-lg border border-gray-800 bg-gray-900/80 p-5 text-sm text-gray-100 shadow-md dark:border-dark-500 dark:bg-dark-800/80">
      <h3 className="text-base font-semibold text-gray-100">
        Resumen de Caja
      </h3>
      <div className="mt-4 space-y-2">
        <p className="flex justify-between">
          <span className="font-medium text-emerald-400">
            Ingresos Totales:
          </span>
          <span className="font-semibold text-emerald-400">
            $ {formatCurrency(ingresos)}
          </span>
        </p>
        <p className="flex justify-between">
          <span className="font-medium text-red-400">Egresos Totales:</span>
          <span className="font-semibold text-red-400">
            $ {formatCurrency(egresos)}
          </span>
        </p>
        <div className="mt-3 border-t border-gray-700 pt-3">
          <p className="flex justify-between">
            <span className="font-semibold">Total en Caja:</span>
            <span className="font-semibold">
              $ {formatCurrency(total)}
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
}

