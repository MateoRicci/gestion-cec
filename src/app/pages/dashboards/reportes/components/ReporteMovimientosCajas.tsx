import { useState } from "react";
import { DatePicker } from "@/components/shared/form/Datepicker";
import { Listbox } from "@/components/shared/form/StyledListbox";
import { useCajasRange, Caja } from "../hooks/useCajasRange";
import { useReporteMovimientosCajas } from "../hooks/useReporteMovimientosCajas";

// Formatters fuera del render para mejor performance
const currencyFormatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
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
    const date = new Date(dateString);
    return dateFormatter.format(date);
}

export function ReporteMovimientosCajas() {
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
    const { movimientos, ingresos, egresos, total, loading, error, generarTicket, generandoTicket } =
        useReporteMovimientosCajas(selectedCaja);

    // Opciones para el selector de caja
    const cajaOptions = [
        { id: 0, label: "Seleccionar caja" },
        ...cajas.map((caja: Caja) => ({
            id: caja.id,
            label: `${caja.descripcion} - ${caja.usuario.persona.nombre} ${caja.usuario.persona.apellido}`,
            value: caja,
        })),
    ];

    const handleCajaChange = (option: any) => {
        if (option.id === 0) {
            setSelectedCaja(null);
        } else {
            setSelectedCaja(option.value);
        }
    };

    const fechaDesdeDate = fechaDesde ? new Date(fechaDesde + "T00:00:00") : new Date();
    const fechaHastaDate = fechaHasta ? new Date(fechaHasta + "T00:00:00") : new Date();

    const handleFechaDesdeChange = (selectedDates: Date[]) => {
        if (selectedDates && selectedDates.length > 0) {
            const date = selectedDates[0];
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            setFechaDesde(`${year}-${month}-${day}`);
            // Reset caja al cambiar fecha
            setSelectedCaja(null);
        }
    };

    const handleFechaHastaChange = (selectedDates: Date[]) => {
        if (selectedDates && selectedDates.length > 0) {
            const date = selectedDates[0];
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            setFechaHasta(`${year}-${month}-${day}`);
            // Reset caja al cambiar fecha
            setSelectedCaja(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-50 mb-4">
                    Movimientos Cajas
                </h3>
                <p className="text-sm text-gray-600 dark:text-dark-300 mb-6">
                    Visualiza los movimientos de una caja y genera su ticket de cierre
                </p>
            </div>

            {/* Selectores de fecha y caja */}
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
                        value={selectedCaja ? cajaOptions.find((opt) => opt.id === selectedCaja.id) : cajaOptions[0]}
                        onChange={handleCajaChange}
                        placeholder="Seleccionar caja"
                    />
                </div>
            </div>

            {/* Botón generar ticket */}
            {selectedCaja && (
                <div className="flex justify-end">
                    <button
                        onClick={generarTicket}
                        disabled={generandoTicket || loading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                    >
                        {generandoTicket ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                Generando...
                            </>
                        ) : (
                            <>
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                    />
                                </svg>
                                Generar Ticket
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Estado de carga */}
            {loading && (
                <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-dark-300">Cargando movimientos...</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
            )}

            {/* Sin caja seleccionada */}
            {!selectedCaja && !loading && (
                <div className="text-center py-8 bg-gray-50 dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-600">
                    <p className="text-gray-600 dark:text-dark-300">
                        Selecciona una caja para ver sus movimientos
                    </p>
                </div>
            )}

            {/* Resumen */}
            {selectedCaja && !loading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">Ingresos</p>
                        <p className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                            {formatCurrency(ingresos)}
                        </p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-700 dark:text-red-300">Egresos</p>
                        <p className="text-xl font-bold text-red-800 dark:text-red-200">
                            {formatCurrency(egresos)}
                        </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300">Balance</p>
                        <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
                            {formatCurrency(total)}
                        </p>
                    </div>
                </div>
            )}

            {/* Tabla de movimientos */}
            {selectedCaja && !loading && !error && movimientos.length > 0 && (
                <div className="bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-600 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
                            <thead className="bg-gray-50 dark:bg-dark-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-300 uppercase tracking-wider">
                                        Monto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-300 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-300 uppercase tracking-wider">
                                        Descripción
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-dark-300 uppercase tracking-wider">
                                        Fecha
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                                {movimientos.map((mov) => {
                                    const isPositivo = mov.monto >= 0;
                                    const montoAbsoluto = Math.abs(mov.monto);
                                    return (
                                        <tr
                                            key={mov.id}
                                            className="hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`text-sm font-semibold ${isPositivo ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                                                        }`}
                                                >
                                                    {isPositivo ? "+" : "-"} {formatCurrency(montoAbsoluto)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`text-xs px-2 py-1 rounded ${isPositivo
                                                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                                        }`}
                                                >
                                                    {mov.tipoMovimientoNombre || "Movimiento"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-700 dark:text-dark-200 truncate max-w-xs">
                                                    {mov.descripcion || <span className="italic text-gray-400">Sin descripción</span>}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <p className="text-sm text-gray-500 dark:text-dark-400">
                                                    {formatDate(mov.createdAt)}
                                                </p>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Sin movimientos */}
            {selectedCaja && !loading && !error && movimientos.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-dark-300">
                        No hay movimientos registrados para esta caja.
                    </p>
                </div>
            )}
        </div>
    );
}
