import { useState } from "react";
import { DatePicker } from "@/components/shared/form/Datepicker";
import { useReporteIngresos } from "../hooks/useReporteIngresos";

export function ReporteIngresos() {
  // Obtener fecha de hoy en formato YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [fechaDesde, setFechaDesde] = useState<string>(getTodayDate());
  const [fechaHasta, setFechaHasta] = useState<string>(getTodayDate());

  const { reporteGroups, loading, error } = useReporteIngresos(
    fechaDesde,
    fechaHasta
  );

  // Convertir string de fecha a Date para el DatePicker
  const fechaDesdeDate = fechaDesde ? new Date(fechaDesde + "T00:00:00") : new Date();
  const fechaHastaDate = fechaHasta ? new Date(fechaHasta + "T00:00:00") : new Date();

  const handleFechaDesdeChange = (selectedDates: Date[]) => {
    if (selectedDates && selectedDates.length > 0) {
      const date = selectedDates[0];
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      setFechaDesde(`${year}-${month}-${day}`);
    }
  };

  const handleFechaHastaChange = (selectedDates: Date[]) => {
    if (selectedDates && selectedDates.length > 0) {
      const date = selectedDates[0];
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      setFechaHasta(`${year}-${month}-${day}`);
    }
  };

  const totalPersonas = reporteGroups.reduce(
    (sum, group) => sum + group.totalCantidad,
    0
  );

  const totalMonto = reporteGroups.reduce(
    (sum, group) => sum + group.totalMonto,
    0
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-50 mb-4">
          Entradas Predio
        </h3>
        <p className="text-sm text-gray-600 dark:text-dark-300 mb-6">
          Visualiza la cantidad de personas que ingresaron al predio agrupadas por tipo de convenio
        </p>
      </div>

      {/* Selectores de fecha */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-2">
            Desde
          </label>
          <DatePicker
            value={fechaDesdeDate}
            onChange={handleFechaDesdeChange}
            options={{
              dateFormat: "d-m-Y",
              maxDate: new Date(),
            }}
            placeholder="Desde"
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-2">
            Hasta
          </label>
          <DatePicker
            value={fechaHastaDate}
            onChange={handleFechaHastaChange}
            options={{
              dateFormat: "d-m-Y",
              maxDate: new Date(),
              minDate: fechaDesdeDate,
            }}
            placeholder="Hasta"
            className="w-full"
          />
        </div>
      </div>

      {/* Resultados */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-dark-300">Cargando reporte...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {!loading && !error && reporteGroups.length > 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-600 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-300 uppercase tracking-wider">
                    Convenio / Producto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-dark-300 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-dark-300 uppercase tracking-wider">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                {reporteGroups.map((group, groupIndex) => (
                  <>
                    {/* Encabezado del Grupo (Convenio) */}
                    <tr key={`group-${groupIndex}`} className="bg-gray-50/50 dark:bg-dark-700/50">
                      <td colSpan={3} className="px-6 py-3 text-sm font-bold text-gray-900 dark:text-dark-50">
                        {group.convenio}
                      </td>
                    </tr>

                    {/* Detalles (Productos) */}
                    {group.detalles.map((detalle, detIndex) => (
                      <tr
                        key={`det-${groupIndex}-${detIndex}`}
                        className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                      >
                        <td className="px-6 py-3 pl-10 text-sm text-gray-600 dark:text-dark-200">
                          {detalle.producto}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600 dark:text-dark-200 text-right">
                          {detalle.cantidad}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600 dark:text-dark-200 text-right">
                          {formatCurrency(detalle.monto)}
                        </td>
                      </tr>
                    ))}

                    {/* Subtotal del Grupo (Opcional, pero util) */}
                    <tr className="border-t border-gray-100 dark:border-dark-700">
                      <td className="px-6 py-2 pl-10 text-xs font-bold text-gray-500 dark:text-dark-300 text-right">
                        Subtotal {group.convenio}
                      </td>
                      <td className="px-6 py-2 text-xs font-bold text-gray-900 dark:text-dark-50 text-right">
                        {group.totalCantidad}
                      </td>
                      <td className="px-6 py-2 text-xs font-bold text-gray-900 dark:text-dark-50 text-right">
                        {formatCurrency(group.totalMonto)}
                      </td>
                    </tr>
                  </>
                ))}

                {/* Total General */}
                <tr className="bg-gray-100 dark:bg-dark-700 font-bold border-t-2 border-gray-200 dark:border-dark-500">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-50">
                    Total General
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-50 text-right">
                    {totalPersonas}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-50 text-right">
                    {formatCurrency(totalMonto)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && reporteGroups.length === 0 && fechaDesde && fechaHasta && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-dark-300">
            No se encontraron ingresos para el rango de fechas seleccionado.
          </p>
        </div>
      )}
    </div>
  );
}

