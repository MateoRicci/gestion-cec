import { useState } from "react";
import { DatePicker } from "@/components/shared/form/Datepicker";
import { Listbox } from "@/components/shared/form/StyledListbox";
import { useReporteIngresos } from "../hooks/useReporteIngresos";
import { useCajasRange, Caja } from "../hooks/useCajasRange";
import { useVentasPorMedioPago } from "../hooks/useVentasPorMedioPago";
import { generateReporteEntradasPDF } from "@/utils/generateReporteEntradasPDF";

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
  const [selectedCaja, setSelectedCaja] = useState<Caja | null>(null);

  const { cajas } = useCajasRange(fechaDesde, fechaHasta);

  // Efecto para resetear la caja seleccionada si cambia el rango de fechas
  // Opcional: Podríamos querer mantenerla si el ID sigue existiendo, pero por simplicidad
  // y para evitar estados inconsistentes (caja de otra fecha), reseteamos a "Todas".
  // Sin embargo, si el usuario solo cambia un día, quizás quiera seguir viendo "Todas".
  // Si seleccionó una caja específica, y cambia de fecha, esa caja ya no es válida para el nuevo rango
  // (porque las cajas son diarias/por turno). Así que resetear a null es correcto.
  /*
  useEffect(() => {
    setSelectedCaja(null);
  }, [fechaDesde, fechaHasta]);
  */
  // Mejor no usar useEffect para esto si podemos evitarlo, pero aqui es necesario saber cuando refrescar.
  // El hook useCajasRange ya refresca las cajas.
  // Si cajas cambia, verificamos si la caja seleccionada sigue existiendo.

  const { reporteGroups, loading, error } = useReporteIngresos(
    fechaDesde,
    fechaHasta,
    selectedCaja?.id ?? null
  );

  const { ingresosPorMedioPago, loading: loadingMedioPago } = useVentasPorMedioPago(
    fechaDesde,
    fechaHasta,
    selectedCaja?.id ?? null
  );

  // Preparar opciones para el select
  const cajaOptions = [
    { id: 0, label: "Todas las cajas" }, // Opción "Todas"
    ...cajas.map((caja: Caja) => ({
      id: caja.id,
      label: `${caja.descripcion} - ${caja.usuario.persona.nombre} ${caja.usuario.persona.apellido}`,
      value: caja
    })),
  ];

  /* Manejo de cambio en el Select */
  const handleCajaChange = (option: any) => {
    if (option.id === 0) {
      setSelectedCaja(null);
    } else {
      setSelectedCaja(option.value);
    }
  };

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

  const handleGeneratePDF = async () => {
    if (!reporteGroups.length) return;

    const cajaInfo = selectedCaja
      ? {
        id: selectedCaja.id,
        descripcion: selectedCaja.descripcion,
        cajeroNombre: `${selectedCaja.usuario.persona.nombre} ${selectedCaja.usuario.persona.apellido}`,
      }
      : null;

    await generateReporteEntradasPDF({
      fechaDesde,
      fechaHasta,
      caja: cajaInfo,
      reporteGroups,
      ingresosPorMedioPago,
      totalPersonas,
      totalMonto,
    });
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
        <div className="flex-1">
          <Listbox
            label="Caja"
            data={cajaOptions}
            displayField="label"
            value={selectedCaja ? cajaOptions.find(opt => opt.id === selectedCaja.id) : cajaOptions[0]}
            onChange={handleCajaChange}
            placeholder="Seleccionar caja"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleGeneratePDF}
            disabled={loading || reporteGroups.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                clipRule="evenodd"
              />
            </svg>
            Generar PDF
          </button>
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

                {/* Totals Breakdown */}
                <tr className="bg-gray-100 dark:bg-dark-700 font-bold border-t-2 border-gray-200 dark:border-dark-500">
                  <td className="px-6 py-2 text-sm text-gray-900 dark:text-dark-50">
                    Total Entradas
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-900 dark:text-dark-50 text-right">
                    {reporteGroups
                      .filter(g => g.convenio !== "Estadías" && g.convenio !== "Turnos")
                      .reduce((sum, g) => sum + g.totalCantidad, 0)}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-900 dark:text-dark-50 text-right">
                    {formatCurrency(
                      reporteGroups
                        .filter(g => g.convenio !== "Estadías" && g.convenio !== "Turnos")
                        .reduce((sum, g) => sum + g.totalMonto, 0)
                    )}
                  </td>
                </tr>

                <tr className="bg-gray-100 dark:bg-dark-700 font-bold">
                  <td className="px-6 py-2 text-sm text-gray-900 dark:text-dark-50">
                    Total Estadías
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-900 dark:text-dark-50 text-right">
                    {reporteGroups
                      .filter(g => g.convenio === "Estadías")
                      .reduce((sum, g) => sum + g.totalCantidad, 0)}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-900 dark:text-dark-50 text-right">
                    {formatCurrency(
                      reporteGroups
                        .filter(g => g.convenio === "Estadías")
                        .reduce((sum, g) => sum + g.totalMonto, 0)
                    )}
                  </td>
                </tr>

                <tr className="bg-gray-100 dark:bg-dark-700 font-bold">
                  <td className="px-6 py-2 text-sm text-gray-900 dark:text-dark-50">
                    Total Turnos
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-900 dark:text-dark-50 text-right">
                    {reporteGroups
                      .filter(g => g.convenio === "Turnos")
                      .reduce((sum, g) => sum + g.totalCantidad, 0)}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-900 dark:text-dark-50 text-right">
                    {formatCurrency(
                      reporteGroups
                        .filter(g => g.convenio === "Turnos")
                        .reduce((sum, g) => sum + g.totalMonto, 0)
                    )}
                  </td>
                </tr>

                {/* Total General (Sum of all) */}
                <tr className="bg-gray-200 dark:bg-dark-600 font-extrabold border-t border-gray-300 dark:border-dark-400">
                  <td className="px-6 py-4 text-base text-gray-900 dark:text-dark-50">
                    TOTAL GENERAL
                  </td>
                  <td className="px-6 py-4 text-base text-gray-900 dark:text-dark-50 text-right">
                    {totalPersonas}
                  </td>
                  <td className="px-6 py-4 text-base text-gray-900 dark:text-dark-50 text-right">
                    {formatCurrency(totalMonto)}
                  </td>
                </tr>

                {/* Sección de Ingresos por Método de Pago */}
                {!loadingMedioPago && ingresosPorMedioPago.length > 0 && (
                  <>
                    <tr className="bg-blue-100 dark:bg-blue-900/30 border-t-2 border-blue-200 dark:border-blue-800">
                      <td colSpan={3} className="px-6 py-3 text-sm font-bold text-blue-900 dark:text-blue-100">
                        MONTOS POR MÉTODO DE PAGO
                      </td>
                    </tr>
                    {ingresosPorMedioPago.map((item) => (
                      <tr
                        key={`medio-pago-${item.medioPagoId}`}
                        className="bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        <td className="px-6 py-3 pl-10 text-sm text-gray-700 dark:text-dark-200">
                          {item.medioPagoNombre}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-dark-200 text-right">
                          -
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-dark-200 text-right">
                          {formatCurrency(item.totalMonto)}
                        </td>
                      </tr>
                    ))}
                  </>
                )}
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

