// Import Dependencies
import { useState, useEffect } from "react";
import { Button, Input, Textarea, Card, GhostSpinner } from "@/components/ui";
import { TbPlus, TbEdit, TbTrash, TbCategory } from "react-icons/tb";
import axios from "@/utils/axios";

// ----------------------------------------------------------------------

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
}

interface CategoriaResponse {
  id: number;
  nombre: string;
  descripcion: string;
  estado?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

interface CategoriaFormData {
  nombre: string;
  descripcion: string;
}

const initialFormData: CategoriaFormData = {
  nombre: "",
  descripcion: "",
};

export function CategoriasTab() {
  // Estado para las categorías
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Estado para el modal de crear/editar
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CategoriaFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<CategoriaFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  // Función para cargar las categorías desde el backend
  const loadCategorias = async () => {
    setIsLoadingList(true);
    setListError(null);

    try {
      const response = await axios.get<CategoriaResponse[]>("/api/productos/categorias");
      
      // Mapear la respuesta
      const categoriasMapeadas: Categoria[] = response.data.map((cat) => ({
        id: cat.id,
        nombre: cat.nombre,
        descripcion: cat.descripcion || "",
      }));

      setCategorias(categoriasMapeadas);
    } catch (err: any) {
      console.error("Error al cargar categorías:", err);
      
      let errorMessage = "Error al cargar las categorías. Por favor, intenta nuevamente.";
      
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

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategorias();
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
  const handleEdit = (categoria: Categoria) => {
    setEditingId(categoria.id);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
    });
    setFormErrors({});
    setError(null);
    setShowModal(true);
  };

  // Función para eliminar una categoría
  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta categoría?")) {
      return;
    }

    try {
      await axios.delete(`/api/productos/categorias/${id}`);
      
      // Recargar la lista después de eliminar
      await loadCategorias();
    } catch (err: any) {
      console.error("Error al eliminar categoría:", err);
      
      let errorMessage = "Error al eliminar la categoría. Por favor, intenta nuevamente.";
      
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
    const errors: Partial<CategoriaFormData> = {};

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
        // Editar categoría existente
        await axios.patch(`/api/productos/categorias/${editingId}`, {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
        });

        // Recargar la lista de categorías después de editar
        await loadCategorias();

        setShowModal(false);
        setFormData(initialFormData);
        setEditingId(null);
      } else {
        // Crear nueva categoría
        await axios.post("/api/productos/categorias", {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
        });

        // Recargar la lista de categorías después de crear
        await loadCategorias();

        setShowModal(false);
        setFormData(initialFormData);
        setEditingId(null);
      }
    } catch (err: any) {
      console.error("Error al guardar categoría:", err);
      
      // Manejar errores
      let errorMessage = "Error al guardar la categoría. Por favor, intenta nuevamente.";
      
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
            Categorías
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-200">
            Organiza tus productos en categorías
          </p>
        </div>
        <Button
          onClick={handleCreate}
          color="primary"
          className="flex items-center gap-2"
        >
          <TbPlus className="size-4" />
          <span>Nueva Categoría</span>
        </Button>
      </div>

      {/* Tabla de categorías */}
      <Card className="overflow-hidden">
        {isLoadingList ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <GhostSpinner className="size-8" variant="soft" />
              <p className="text-sm text-gray-500 dark:text-dark-200">
                Cargando categorías...
              </p>
            </div>
          </div>
        ) : listError ? (
          <div className="p-6">
            <div className="rounded-lg bg-error/10 p-4 text-sm text-error dark:bg-error/20 dark:text-error-light">
              {listError}
            </div>
            <Button
              onClick={loadCategorias}
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
                {categorias.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-dark-200">
                      No hay categorías registradas
                    </td>
                  </tr>
                ) : (
                  categorias.map((categoria) => (
                    <tr
                      key={categoria.id}
                      className="border-b border-gray-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TbCategory className="size-4 text-primary-500" />
                          <span className="font-medium text-gray-800 dark:text-dark-50">
                            {categoria.nombre}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-dark-200">
                        {categoria.descripcion || (
                          <span className="italic text-gray-400 dark:text-dark-400">
                            Sin descripción
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleEdit(categoria)}
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
                            onClick={() => handleDelete(categoria.id)}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={handleCloseModal}
        >
          <Card
            className="w-full max-w-md bg-white shadow-xl dark:bg-dark-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-dark-50">
                {editingId ? "Editar Categoría" : "Nueva Categoría"}
              </h2>

              <div className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-error/10 p-3 text-sm text-error dark:bg-error/20 dark:text-error-light">
                    {error}
                  </div>
                )}

                <Input
                  label="Nombre"
                  placeholder="Ej: Electrónica"
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
                  placeholder="Descripción de la categoría..."
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
  );
}

