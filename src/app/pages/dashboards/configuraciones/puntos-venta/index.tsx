// Import Dependencies
import { useState, useEffect } from "react";
import { Page } from "@/components/shared/Page";
import { Button, Input, Textarea, Card, GhostSpinner } from "@/components/ui";
import { TbPlus, TbEdit, TbTrash, TbBuildingStore } from "react-icons/tb";
import { PuntoDeVenta } from "@/app/contexts/ventas/context";
import axios from "@/utils/axios";

// ----------------------------------------------------------------------

interface PuntoDeVentaFormData {
  nombre: string;
  descripcion: string;
}

const initialFormData: PuntoDeVentaFormData = {
  nombre: "",
  descripcion: "",
};

interface PuntoDeVentaResponse {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export default function PuntosDeVentaConfig() {
  // Estado para los puntos de venta
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoDeVenta[]>([]);

  // Estado para el modal de crear/editar
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PuntoDeVentaFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<PuntoDeVentaFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  // Función para cargar los puntos de venta desde el backend
  const loadPuntosDeVenta = async () => {
    setIsLoadingList(true);
    setListError(null);

    try {
      const response = await axios.get<PuntoDeVentaResponse[]>("/puntos-venta");
      
      // Mapear la respuesta para guardar solo id, nombre y descripcion
      const puntosMapeados: PuntoDeVenta[] = response.data.map((pv) => ({
        id: pv.id,
        nombre: pv.nombre,
        descripcion: pv.descripcion || "",
        estado: pv.estado,
      }));

      setPuntosDeVenta(puntosMapeados);
    } catch (err: any) {
      console.error("Error al cargar puntos de venta:", err);
      
      let errorMessage = "Error al cargar los puntos de venta. Por favor, intenta nuevamente.";
      
      if (err?.response?.data) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setListError(errorMessage);
    } finally {
      setIsLoadingList(false);
    }
  };

  // Cargar puntos de venta al montar el componente
  useEffect(() => {
    loadPuntosDeVenta();
  }, []);

  // Función para abrir el modal de creación
  const handleCreate = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setFormErrors({});
    setShowModal(true);
  };

  // Función para abrir el modal de edición
  const handleEdit = (pv: PuntoDeVenta) => {
    setEditingId(pv.id);
    setFormData({
      nombre: pv.nombre,
      descripcion: pv.descripcion || "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Función para eliminar un punto de venta
  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este punto de venta?")) {
      return;
    }

    try {
      await axios.delete(`/puntos-venta/${id}`);
      
      // Recargar la lista después de eliminar
      await loadPuntosDeVenta();
    } catch (err: any) {
      console.error("Error al eliminar punto de venta:", err);
      
      let errorMessage = "Error al eliminar el punto de venta. Por favor, intenta nuevamente.";
      
      if (err?.response?.data) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    }
  };

  // Validación del formulario
  const validateForm = (): boolean => {
    const errors: Partial<PuntoDeVentaFormData> = {};

    if (!formData.nombre.trim()) {
      errors.nombre = "El nombre es requerido";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Función para guardar (crear o editar)
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (editingId) {
        // Editar punto de venta existente
        await axios.patch(`/puntos-venta/${editingId}`, {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
        });

        // Recargar la lista de puntos de venta después de editar
        await loadPuntosDeVenta();

        setShowModal(false);
        setFormData(initialFormData);
        setEditingId(null);
      } else {
        // Crear nuevo punto de venta
        await axios.post("/puntos-venta", {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
        });

        // Recargar la lista de puntos de venta después de crear
        await loadPuntosDeVenta();

        setShowModal(false);
        setFormData(initialFormData);
        setEditingId(null);
      }
    } catch (err: any) {
      console.error("Error al crear punto de venta:", err);
      
      // Manejar errores
      let errorMessage = "Error al crear el punto de venta. Por favor, intenta nuevamente.";
      
      if (err?.response?.data) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cerrar el modal
  const handleCloseModal = () => {
    if (isLoading) return; // No permitir cerrar mientras se está guardando
    setShowModal(false);
    setFormData(initialFormData);
    setEditingId(null);
    setFormErrors({});
    setError(null);
  };

  return (
    <Page title="Configuración de Puntos de Venta">
      <div className="flex w-full flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-dark-50">
              Puntos de Venta
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-200">
              Gestiona los puntos de venta de tu negocio
            </p>
          </div>
          <Button
            onClick={handleCreate}
            color="primary"
            className="flex items-center gap-2"
          >
            <TbPlus className="size-4" />
            <span>Nuevo Punto de Venta</span>
          </Button>
        </div>

        {/* Tabla de puntos de venta */}
        <Card className="overflow-hidden">
          {isLoadingList ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <GhostSpinner className="size-8" variant="soft" />
                <p className="text-sm text-gray-500 dark:text-dark-200">
                  Cargando puntos de venta...
                </p>
              </div>
            </div>
          ) : listError ? (
            <div className="p-6">
              <div className="rounded-lg bg-error/10 p-4 text-sm text-error dark:bg-error/20 dark:text-error-light">
                {listError}
              </div>
              <Button
                onClick={loadPuntosDeVenta}
                color="primary"
                variant="flat"
                className="mt-4"
              >
                Reintentar
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table is-hoverable w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-dark-600">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-200">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-200">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-200">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {puntosDeVenta.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-dark-200">
                        No hay puntos de venta registrados
                      </td>
                    </tr>
                  ) : (
                    puntosDeVenta.map((pv) => (
                      <tr
                        key={pv.id}
                        className="border-b border-gray-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <TbBuildingStore className="size-4 text-primary-500" />
                            <span className="font-medium text-gray-800 dark:text-dark-50">
                              {pv.nombre}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-dark-200">
                          {pv.descripcion || (
                            <span className="italic text-gray-400 dark:text-dark-400">
                              Sin descripción
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => handleEdit(pv)}
                              variant="flat"
                              color="primary"
                              isIcon
                              className="size-8"
                              data-tooltip
                              data-tooltip-content="Editar"
                            >
                              <TbEdit className="size-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(pv.id)}
                              variant="flat"
                              color="error"
                              isIcon
                              className="size-8"
                              data-tooltip
                              data-tooltip-content="Eliminar"
                            >
                              <TbTrash className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Modal de crear/editar */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={handleCloseModal}
          >
            <Card
              className="w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-dark-50">
                  {editingId ? "Editar Punto de Venta" : "Nuevo Punto de Venta"}
                </h2>

                <div className="space-y-4">
                  {error && (
                    <div className="rounded-lg bg-error/10 p-3 text-sm text-error dark:bg-error/20 dark:text-error-light">
                      {error}
                    </div>
                  )}

                  <Input
                    label="Nombre"
                    placeholder="Ej: Sucursal Centro"
                    value={formData.nombre}
                    onChange={(e) => {
                      setFormData({ ...formData, nombre: e.target.value });
                      setError(null);
                    }}
                    error={formErrors.nombre}
                    required
                    autoFocus
                    disabled={isLoading}
                  />

                  <Textarea
                    label="Descripción"
                    placeholder="Descripción del punto de venta..."
                    value={formData.descripcion}
                    onChange={(e) => {
                      setFormData({ ...formData, descripcion: e.target.value });
                      setError(null);
                    }}
                    rows={3}
                    error={formErrors.descripcion}
                    disabled={isLoading}
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    onClick={handleCloseModal}
                    variant="flat"
                    color="neutral"
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    color="primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <GhostSpinner className="size-4" variant="soft" />
                        <span>Guardando...</span>
                      </div>
                    ) : (
                      editingId ? "Guardar Cambios" : "Crear"
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Page>
  );
}

