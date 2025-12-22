// Import Dependencies
import { useEffect, useState } from "react";
import { Card, GhostSpinner, Button } from "@/components/ui";
import { TbEye } from "react-icons/tb";
import axios from "@/utils/axios";

// ----------------------------------------------------------------------

interface Importacion {
  id: number;
  usuario_id: number;
  archivo: string;
  estado: string;
  total_filas: number;
  procesadas: number;
  errores: number;
  created_at: string;
  updated_at: string;
}

interface DetalleImportacion {
  id: number;
  importacion_id: number;
  fila: number;
  estado: string;
  mensaje: string | null;
  data: string;
  created_at: string;
  updated_at: string;
}

interface ImportacionConDetalles extends Importacion {
  detalles: DetalleImportacion[];
}

export function HistorialImportacionesTab() {
  const [importaciones, setImportaciones] = useState<Importacion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [detalleImportacion, setDetalleImportacion] = useState<ImportacionConDetalles | null>(null);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false);

  const loadImportaciones = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get<Importacion[]>("/api/importaciones");
      const data = response.data ?? [];
      // Ordenar por fecha más reciente primero
      const sorted = data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setImportaciones(sorted);
    } catch (err: any) {
      let message =
        "Error al cargar las importaciones. Por favor, intenta nuevamente.";

      if (err?.response?.data) {
        if (typeof err.response.data === "string") {
          message = err.response.data;
        } else if (err.response.data.message) {
          message = err.response.data.message;
        } else if (err.response.data.error) {
          message = err.response.data.error;
        }
      } else if (err?.message) {
        message = err.message;
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadImportaciones();
  }, []);

  const handleVerDetalle = async (id: number) => {
    setIsLoadingDetalle(true);
    setError(null);

    try {
      const response = await axios.get<ImportacionConDetalles>(
        `/api/importaciones/${id}/detalle`
      );
      setDetalleImportacion(response.data);
      setShowDetalleModal(true);
    } catch (err: any) {
      let message = "Error al cargar el detalle. Por favor, intenta nuevamente.";

      if (err?.response?.data) {
        if (typeof err.response.data === "string") {
          message = err.response.data;
        } else if (err.response.data.message) {
          message = err.response.data.message;
        } else if (err.response.data.error) {
          message = err.response.data.error;
        }
      } else if (err?.message) {
        message = err.message;
      }

      alert(message);
    } finally {
      setIsLoadingDetalle(false);
    }
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { label: string; className: string }> = {
      completado: {
        label: "Completado",
        className: "bg-success/10 text-success dark:bg-success/20 dark:text-success-light",
      },
      completado_con_errores: {
        label: "Completado con errores",
        className: "bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning-light",
      },
      error: {
        label: "Error",
        className: "bg-error/10 text-error dark:bg-error/20 dark:text-error-light",
      },
      procesando: {
        label: "Procesando",
        className: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light",
      },
    };

    const estadoConfig = estados[estado] || {
      label: estado,
      className: "bg-gray-100 text-gray-700 dark:bg-dark-600 dark:text-dark-300",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoConfig.className}`}
      >
        {estadoConfig.label}
      </span>
    );
  };

  const parseData = (dataString: string) => {
    try {
      return JSON.parse(dataString);
    } catch {
      return [];
    }
  };

  return (
    <div className="flex w-full flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
          Historial de Importaciones
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-dark-200">
          Revisa el historial de todas las importaciones realizadas
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </Card>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <GhostSpinner />
        </div>
      ) : (
        /* Table */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-dark-300">
                    Archivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-dark-300">
                    Fecha de Importación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-dark-300">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-dark-300">
                    Procesadas
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-dark-300">
                    Errores
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-dark-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-dark-600 dark:bg-dark-800">
                {importaciones.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-sm text-gray-500 dark:text-dark-300"
                    >
                      No hay importaciones registradas
                    </td>
                  </tr>
                ) : (
                  importaciones.map((importacion) => (
                    <tr
                      key={importacion.id}
                      className="hover:bg-gray-50 dark:hover:bg-dark-700"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-dark-50">
                        {importacion.archivo}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-dark-300">
                        {formatFecha(importacion.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        {getEstadoBadge(importacion.estado)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-center text-gray-500 dark:text-dark-300">
                        {importacion.procesadas}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-center text-gray-500 dark:text-dark-300">
                        {importacion.errores > 0 ? (
                          <span className="text-error dark:text-error-light font-medium">
                            {importacion.errores}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-dark-400">0</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <Button
                          onClick={() => handleVerDetalle(importacion.id)}
                          disabled={isLoadingDetalle}
                          variant="outlined"
                          className="h-8 px-3 text-xs flex items-center gap-2"
                        >
                          <TbEye className="h-4 w-4" />
                          Ver detalle
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detalle Modal */}
      {showDetalleModal && detalleImportacion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => {
            setShowDetalleModal(false);
            setDetalleImportacion(null);
          }}
        >
          <Card
            className="w-full max-w-5xl max-h-[90vh] bg-white shadow-xl dark:bg-dark-800 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex-shrink-0 border-b border-gray-200 dark:border-dark-600">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
                    Detalle de Importación
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
                    {detalleImportacion.archivo}
                  </p>
                </div>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowDetalleModal(false);
                    setDetalleImportacion(null);
                  }}
                  className="h-9 min-w-[7rem]"
                >
                  Cerrar
                </Button>
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-dark-300">Estado: </span>
                  {getEstadoBadge(detalleImportacion.estado)}
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-300">Procesadas: </span>
                  <span className="font-medium text-gray-900 dark:text-dark-50">
                    {detalleImportacion.procesadas}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-300">Errores: </span>
                  <span className="font-medium text-error dark:text-error-light">
                    {detalleImportacion.errores}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-dark-300">Fecha: </span>
                  <span className="font-medium text-gray-900 dark:text-dark-50">
                    {formatFecha(detalleImportacion.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingDetalle ? (
                <div className="flex justify-center py-12">
                  <GhostSpinner />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-dark-700 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-dark-300">
                          Fila
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-dark-300">
                          Estado
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-dark-300">
                          Datos
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-dark-600 dark:bg-dark-800">
                      {detalleImportacion.detalles.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-8 text-center text-sm text-gray-500 dark:text-dark-300"
                          >
                            No hay detalles disponibles
                          </td>
                        </tr>
                      ) : (
                        detalleImportacion.detalles
                          .sort((a, b) => a.fila - b.fila)
                          .map((detalle) => {
                            const dataParsed = parseData(detalle.data);
                            return (
                              <tr
                                key={detalle.id}
                                className="hover:bg-gray-50 dark:hover:bg-dark-700"
                              >
                                <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900 dark:text-dark-50">
                                  {detalle.fila}
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-sm">
                                  {detalle.estado === "ok" ? (
                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-success/10 text-success dark:bg-success/20 dark:text-success-light">
                                      OK
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-error/10 text-error dark:bg-error/20 dark:text-error-light">
                                      Error
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500 dark:text-dark-300">
                                  <div className="max-w-md">
                                    <pre className="whitespace-pre-wrap break-words text-xs bg-gray-50 dark:bg-dark-700 p-2 rounded">
                                      {Array.isArray(dataParsed)
                                        ? dataParsed.join(", ")
                                        : detalle.data}
                                    </pre>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

