import { useMovimientosCaja, MovimientoCaja } from "../hooks/useMovimientosCaja";

interface CajaMovimientosProps {
  cajaId: number | null;
}

function formatCurrency(amount: number): string {
  // Formatear sin decimales, solo con separadores de miles
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function MovimientoItem({ movimiento }: { movimiento: MovimientoCaja }) {
  const isPositivo = movimiento.monto > 0;
  const montoAbsoluto = Math.abs(movimiento.monto);
  const colorClass = isPositivo ? "text-emerald-400" : "text-red-400";
  const icon = isPositivo ? "+" : "-";

  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-700/50 py-3 last:border-b-0">
      {/* Monto y tipo */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-sm font-semibold ${colorClass} whitespace-nowrap`}>
          {icon} ${formatCurrency(montoAbsoluto)}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${
            isPositivo
              ? "bg-emerald-400/20 text-emerald-400"
              : "bg-red-400/20 text-red-400"
          }`}
        >
          {movimiento.tipoMovimientoNombre}
        </span>
      </div>

      {/* Descripción */}
      <div className="flex-1 min-w-0">
        {movimiento.descripcion ? (
          <p className="text-xs text-gray-400 truncate">{movimiento.descripcion}</p>
        ) : (
          <p className="text-xs text-gray-500 italic">Sin descripción</p>
        )}
      </div>

      {/* Fecha */}
      <div className="shrink-0">
        <p className="text-xs text-gray-500 whitespace-nowrap">
          {formatDate(movimiento.createdAt)}
        </p>
      </div>
    </div>
  );
}

export function CajaMovimientos({ cajaId }: CajaMovimientosProps) {
  const { movimientos, loading } = useMovimientosCaja(cajaId);

  return (
    <aside className="w-full rounded-lg border border-gray-800 bg-gray-900/80 p-5 text-sm text-gray-100 shadow-md dark:border-dark-500 dark:bg-dark-800/80">
      <h3 className="text-base font-semibold text-gray-100">Movimientos</h3>
      <div className="mt-4 max-h-[400px] overflow-y-auto">
        {loading ? (
          <p className="py-4 text-center text-xs text-gray-400">
            Cargando movimientos...
          </p>
        ) : movimientos.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">
            No hay movimientos registrados
          </p>
        ) : (
          <div className="space-y-1">
            {movimientos.map((movimiento) => (
              <MovimientoItem key={movimiento.id} movimiento={movimiento} />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

