// Import Dependencies
import { useState, useEffect } from "react";
import { Button, Input, Textarea, Card, GhostSpinner } from "@/components/ui";
import { TbPlus, TbEdit, TbTrash, TbCurrencyDollar } from "react-icons/tb";
import axios from "@/utils/axios";

// ----------------------------------------------------------------------

interface ListaPrecios {
  id: number;
  nombre: string;
  descripcion: string;
}

interface ListaPreciosResponse {
  id: number;
  nombre: string;
  descripcion: string;
  estado?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

interface ListaPreciosFormData {
  nombre: string;
  descripcion: string;
}

const initialFormData: ListaPreciosFormData = {
  nombre: "",
  descripcion: "",
};

export function ListaPreciosTab() {
  // Estado para las listas de precios
  const [listasPrecios, setListasPrecios] = useState<ListaPrecios[]>([]);

  // Estado para el modal de crear/editar
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ListaPreciosFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<ListaPreciosFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  // Función para cargar las listas de precios desde el backend
  const loadListasPrecios = async () => {
    setIsLoadingList(true);
    setListError(null);

    try {
      const response = await axios.get<ListaPreciosResponse[]>("/lista-precios");
      
      // Mapear la respuesta
      const listasMapeadas: ListaPrecios[] = response.data.map((lista) => ({
        id: lista.id,
        nombre: lista.nombre,
        descripcion: lista.descripcion || "",
      }));

      setListasPrecios(listasMapeadas);
    } catch (err: any) {
      console.error("Error al cargar listas de precios:", err);
      
      let errorMessage = "Error al cargar las listas de precios. Por favor, intenta nuevamente.";
      
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

  // Cargar listas de precios al montar el componente
  useEffect(() => {
    loadListasPrecios();
  }, []);

  // Función para abrir el modal de creación
  const handleCreate = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setFormErrors({});
    setError(null);
    setShowModal(true);
  };

  // Función para abrir el modal de edición
  const handleEdit = (lista: ListaPrecios) => {
    setEditingId(lista.id);
    setFormData({
      nombre: lista.nombre,
      descripcion: lista.descripcion || "",
    });
    setFormErrors({});
    setError(null);
    setShowModal(true);
  };

  // Función para eliminar una lista de precios
  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta lista de precios?")) {
      return;
    }

    try {
      await axios.delete(`/lista-precios/${id}`);
      
      // Recargar la lista después de eliminar
      await loadListasPrecios();
    } catch (err: any) {
      console.error("Error al eliminar lista de precios:", err);
      
      let errorMessage = "Error al eliminar la lista de precios. Por favor, intenta nuevamente.";
      
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
    const errors: Partial<ListaPreciosFormData> = {};

    if (!formData.nombre.trim()) {
      errors.nombre = "El nombre es requerido";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
      };

      if (editingId) {
        // Actualizar lista de precios existente
        await axios.patch(`/lista-precios/${editingId}`, payload);
      } else {
        // Crear nueva lista de precios
        await axios.post("/lista-precios", payload);
      }

      // Cerrar el modal y recargar la lista
      handleCloseModal();
      await loadListasPrecios();
    } catch (err: any) {
      console.error("Error al guardar lista de precios:", err);
      
      let errorMessage = "Error al guardar la lista de precios. Por favor, intenta nuevamente.";
      
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
    if (isLoading) return;
    setShowModal(false);
    setFormData(initialFormData);
    setEditingId(null);
    setFormErrors({});
    setError(null);
  };

  return (
    <div className="flex w-full flex-col">
      {/* Header con botón de crear */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
            Listas de Precios
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-200">
            Gestiona las listas de precios disponibles
          </p>
        </div>
        <Button
          onClick={handleCreate}
          color="primary"
          className="flex items-center gap-2"
        >
          <TbPlus className="size-4" />
          <span>Nueva Lista de Precios</span>
        </Button>
      </div>

      {/* Tabla de listas de precios */}
      <Card className="overflow-hidden">
        {isLoadingList ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <GhostSpinner className="size-8" variant="soft" />
              <p className="text-sm text-gray-500 dark:text-dark-200">
                Cargando listas de precios...
              </p>
            </div>
          </div>
        ) : listError ? (
          <div className="p-6">
            <div className="rounded-lg border border-error-200 bg-error-50 p-4 dark:border-error-800 dark:bg-error-900/20">
              <p className="text-sm text-error-600 dark:text-error-400">
                {listError}
              </p>
              <Button
                onClick={loadListasPrecios}
                color="error"
                variant="flat"
                className="mt-4"
              >
                Reintentar
              </Button>
            </div>
          </div>
        ) : listasPrecios.length === 0 ? (
          <div className="p-6 text-center">
            <TbCurrencyDollar className="mx-auto size-12 text-gray-400 dark:text-dark-400" />
            <p className="mt-4 text-sm text-gray-500 dark:text-dark-200">
              No hay listas de precios disponibles
            </p>
            <Button
              onClick={handleCreate}
              color="primary"
              variant="flat"
              className="mt-4"
            >
              Crear primera lista de precios
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-200">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-200">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-dark-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-dark-600 dark:bg-dark-800">
                {listasPrecios.map((lista) => (
                  <tr
                    key={lista.id}
                    className="hover:bg-gray-50 dark:hover:bg-dark-700"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-dark-50">
                      {lista.nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-dark-200">
                      {lista.descripcion || "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => handleEdit(lista)}
                          color="neutral"
                          variant="flat"
                          className="flex items-center gap-1"
                        >
                          <TbEdit className="size-4" />
                          <span>Editar</span>
                        </Button>
                        <Button
                          onClick={() => handleDelete(lista.id)}
                          color="error"
                          variant="flat"
                          className="flex items-center gap-1"
                        >
                          <TbTrash className="size-4" />
                          <span>Eliminar</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de crear/editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white shadow-xl dark:border-dark-600 dark:bg-dark-800">
            <div className="border-b border-gray-200 p-4 dark:border-dark-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-50">
                {editingId ? "Editar Lista de Precios" : "Nueva Lista de Precios"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              {error && (
                <div className="mb-4 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <Input
                  label="Nombre"
                  placeholder="Ingrese el nombre de la lista"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  error={formErrors.nombre}
                  required
                />

                <Textarea
                  label="Descripción"
                  placeholder="Ingrese una descripción (opcional)"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  error={formErrors.descripcion}
                  rows={3}
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={handleCloseModal}
                  color="neutral"
                  variant="flat"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" color="primary" disabled={isLoading}>
                  {isLoading ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




