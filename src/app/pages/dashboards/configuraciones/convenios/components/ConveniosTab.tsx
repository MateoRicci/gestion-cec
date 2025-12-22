// Import Dependencies
import { useEffect, useState } from "react";
import { Card, GhostSpinner, Button, Input, Textarea } from "@/components/ui";
import { TbEdit, TbTrash, TbPlus } from "react-icons/tb";
import axios from "@/utils/axios";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

// ----------------------------------------------------------------------

interface TipoConvenio {
  id: number;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ConvenioFormData {
  nombre: string;
  descripcion: string;
}

const initialFormData: ConvenioFormData = {
  nombre: "",
  descripcion: "",
};

type ConvenioFormErrors = Partial<Record<keyof ConvenioFormData, string>> & {
  submit?: string;
};

export function ConveniosTab() {
  const [convenios, setConvenios] = useState<TipoConvenio[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ConvenioFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<ConvenioFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadConvenios = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get<TipoConvenio[]>("/api/tipos-convenios");
      const data = response.data ?? [];
      setConvenios(data);
    } catch (err: any) {
      let message =
        "Error al cargar los convenios. Por favor, intenta nuevamente.";

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
    void loadConvenios();
  }, []);

  const handleOpenModal = (convenio?: TipoConvenio) => {
    if (convenio) {
      setEditingId(convenio.id);
      setFormData({
        nombre: convenio.nombre,
        descripcion: convenio.descripcion || "",
      });
    } else {
      setEditingId(null);
      setFormData(initialFormData);
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: ConvenioFormErrors = {};

    if (!formData.nombre.trim()) {
      errors.nombre = "El nombre es requerido";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const payload: { nombre: string; descripcion?: string } = {
        nombre: formData.nombre.trim(),
      };

      if (formData.descripcion.trim()) {
        payload.descripcion = formData.descripcion.trim();
      }

      if (editingId) {
        await axios.put(`/api/tipos-convenios/${editingId}`, payload);
      } else {
        await axios.post("/api/tipos-convenios", payload);
      }

      await loadConvenios();
      handleCloseModal();
    } catch (err: any) {
      let message = editingId
        ? "Error al actualizar el convenio. Por favor, intenta nuevamente."
        : "Error al crear el convenio. Por favor, intenta nuevamente.";

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

      setFormErrors({ submit: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    setIsDeleting(true);

    try {
      await axios.delete(`/api/tipos-convenios/${deletingId}`);
      await loadConvenios();
      setShowDeleteModal(false);
      setDeletingId(null);
    } catch (err: any) {
      let message = "Error al eliminar el convenio. Por favor, intenta nuevamente.";

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
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex w-full flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
            Convenios
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-200">
            Gestiona los tipos de convenios disponibles
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2"
        >
          <TbPlus className="h-4 w-4" />
          Nuevo Convenio
        </Button>
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
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-dark-300">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-dark-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-dark-600 dark:bg-dark-800">
                {convenios.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-8 text-center text-sm text-gray-500 dark:text-dark-300"
                    >
                      No hay convenios registrados
                    </td>
                  </tr>
                ) : (
                  convenios.map((convenio) => (
                    <tr
                      key={convenio.id}
                      className="hover:bg-gray-50 dark:hover:bg-dark-700"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-dark-50">
                        {convenio.nombre}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-dark-300">
                        {convenio.descripcion || (
                          <span className="italic text-gray-400 dark:text-dark-400">
                            Sin descripción
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(convenio)}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                            title="Editar"
                          >
                            <TbEdit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(convenio.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Eliminar"
                          >
                            <TbTrash className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={handleCloseModal}
        >
          <Card
            className="w-full max-w-md bg-white shadow-xl dark:bg-dark-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="mb-6 text-xl font-semibold text-gray-800 dark:text-dark-50">
                {editingId ? "Editar Convenio" : "Nuevo Convenio"}
              </h2>

              <div className="space-y-4">
                {formErrors.submit && (
                  <div className="rounded-lg bg-error/10 p-3 text-sm text-error dark:bg-error/20 dark:text-error-light">
                    {formErrors.submit}
                  </div>
                )}

                <Input
                  label="Nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Ej: Empleado CEC"
                  error={formErrors.nombre}
                  required
                  autoFocus
                  disabled={isSaving}
                />

                <Textarea
                  label="Descripción"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  rows={3}
                  placeholder="Descripción opcional del convenio"
                  disabled={isSaving}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outlined"
                    onClick={handleCloseModal}
                    disabled={isSaving}
                    className="h-9 min-w-[7rem]"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="h-9 min-w-[7rem]"
                  >
                    {isSaving ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingId(null);
        }}
        onOk={handleDeleteConfirm}
        state={isDeleting ? "pending" : "pending"}
        confirmLoading={isDeleting}
        messages={{
          pending: {
            title: "¿Eliminar convenio?",
            description:
              "¿Estás seguro de que deseas eliminar este convenio? Esta acción no se puede deshacer.",
            actionText: "Eliminar",
          },
        }}
      />
    </div>
  );
}

