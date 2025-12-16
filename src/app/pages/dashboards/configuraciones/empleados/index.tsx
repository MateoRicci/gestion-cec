// Import Dependencies
import { useEffect, useState } from "react";
import { Page } from "@/components/shared/Page";
import { Card, GhostSpinner, Button, Input, Checkbox } from "@/components/ui";
import { TbEdit } from "react-icons/tb";
import axios from "@/utils/axios";
import { Role } from "@/@types/user";

// ----------------------------------------------------------------------

// Tipo que viene del backend (puede incluir persona u otros datos)
interface EmpleadoApi {
  id: string;
  persona_id: string;
  codigo_empleado: string;
  fecha_contratacion: string;
  fecha_despido: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  persona?: {
    id: string;
    nombre: string;
    apellido: string;
    numero_documento: number;
    tipo_documento_id: number;
    email: string;
    telefono: string | null;
    direccion: string | null;
    ciudad: string | null;
    provincia: string | null;
    pais: string | null;
    fecha_nacimiento: string;
    genero_id: number | null;
    estado_civil_id: number | null;
    activo: boolean;
    notas: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

// Tipo que usamos en la UI (lo que muestra la tabla)
interface Empleado {
  id: string;
  codigo_empleado: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  activo: boolean;
}

type EmpleadoResponse = EmpleadoApi[];


interface EmpleadoFormData {
  nombre: string;
  apellido: string;
  email: string;
  numero_documento: string;
  fecha_nacimiento: string;
  username: string;
  password: string;
  codigo_empleado: string;
  fecha_contratacion: string;
  rol_id: number | null; // ID del rol seleccionado (solo uno)
}

const initialFormData: EmpleadoFormData = {
  nombre: "",
  apellido: "",
  email: "",
  numero_documento: "",
  fecha_nacimiento: "",
  username: "",
  password: "",
  codigo_empleado: "",
  fecha_contratacion: "",
  rol_id: null,
};

type EmpleadoFormErrors = Partial<Record<keyof EmpleadoFormData, string>>;

export default function EmpleadosConfig() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empleadosApi, setEmpleadosApi] = useState<EmpleadoApi[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EmpleadoFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<EmpleadoFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado para los roles disponibles
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const loadEmpleados = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get<EmpleadoResponse>("/api/empleados");
      const data = response.data ?? [];

      setEmpleadosApi(data);

      const mapped: Empleado[] = data.map((e) => ({
        id: e.id,
        codigo_empleado: e.codigo_empleado,
        nombre: e.persona?.nombre || "",
        apellido: e.persona?.apellido || "",
        email: e.persona?.email || "",
        telefono: e.persona?.telefono || "",
        activo: e.activo,
      }));

      setEmpleados(mapped);
    } catch (err: any) {
      let message =
        "Error al cargar los empleados. Por favor, intenta nuevamente.";

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

  // Función para cargar los roles disponibles
  const loadRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const response = await axios.get<Role[]>("/api/roles-permisos/roles");
      const allRoles = response.data || [];
      // Filtrar el primer rol (Admin) y mostrar el resto
      // Asegurar que los IDs sean números enteros
      const rolesSinAdmin = (allRoles.length > 0 ? allRoles.slice(1) : allRoles).map((role) => ({
        ...role,
        id: Number.parseInt(String(role.id), 10),
      }));
      setAvailableRoles(rolesSinAdmin);
    } catch (err: any) {
      console.error("Error al cargar roles:", err);
      // Si falla, usar roles por defecto basados en la lista proporcionada (sin Admin)
      setAvailableRoles([
        { id: 2, name: "Empleado Venta", guard_name: "api" },
        { id: 3, name: "Empleado Administrativo", guard_name: "api" },
        { id: 4, name: "Empleado Supervisor", guard_name: "api" },
        { id: 5, name: "Cliente", guard_name: "api" },
        { id: 6, name: "Proveedor", guard_name: "api" },
        { id: 7, name: "Acreedor", guard_name: "api" },
      ]);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  useEffect(() => {
    void loadEmpleados();
    void loadRoles();
  }, []);

  const handleOpenModal = () => {
    setEditingId(null);
    setFormData({ ...initialFormData, rol_id: null });
    setFormErrors({});
    setError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setShowModal(false);
    setEditingId(null);
    setFormData({ ...initialFormData, rol_id: null });
    setFormErrors({});
    setError(null);
  };

  const handleEditEmpleado = (empleadoId: string) => {
    const api = empleadosApi.find((e) => e.id === empleadoId);
    if (!api) return;

    const persona = api.persona;

    setEditingId(api.id);
    setFormErrors({});
    setError(null);

    setFormData({
      nombre: persona?.nombre || "",
      apellido: persona?.apellido || "",
      email: persona?.email || "",
      numero_documento: persona?.numero_documento
        ? String(persona.numero_documento)
        : "",
      fecha_nacimiento: persona?.fecha_nacimiento
        ? persona.fecha_nacimiento.slice(0, 10)
        : "",
      username: "",
      password: "",
      codigo_empleado: api.codigo_empleado || "",
      fecha_contratacion: api.fecha_contratacion
        ? api.fecha_contratacion.slice(0, 10)
        : "",
      rol_id: null, // No se editan roles
    });

    setShowModal(true);
  };


  const validateForm = (): boolean => {
    const errors: EmpleadoFormErrors = {};

    if (!formData.nombre.trim()) errors.nombre = "El nombre es requerido";
    if (!formData.apellido.trim()) errors.apellido = "El apellido es requerido";
    if (!formData.email.trim()) errors.email = "El email es requerido";
    if (!editingId) {
      if (!formData.username.trim())
        errors.username = "El nombre de usuario es requerido";
      if (!formData.password.trim())
        errors.password = "La contraseña es requerida";
      if (!formData.rol_id || formData.rol_id === null)
        errors.rol_id = "Debe seleccionar un rol";
    }
    if (!formData.codigo_empleado.trim())
      errors.codigo_empleado = "El código de empleado es requerido";
    if (!formData.fecha_contratacion)
      errors.fecha_contratacion = "La fecha de contratación es requerida";
    if (!formData.fecha_nacimiento)
      errors.fecha_nacimiento = "La fecha de nacimiento es requerida";
    if (!formData.numero_documento.trim())
      errors.numero_documento = "El número de documento es requerido";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setError(null);

    try {
      if (editingId) {
        // Actualizar empleado existente (PUT)
        const payloadUpdate = {
          persona: {
            nombre: formData.nombre,
            apellido: formData.apellido,
            email: formData.email,
            tipo_documento_id: 1,
            numero_documento: formData.numero_documento,
            fecha_nacimiento: formData.fecha_nacimiento,
          },
          codigo_empleado: formData.codigo_empleado,
          fecha_contratacion: formData.fecha_contratacion,
        };

        await axios.put(`/api/empleados/${editingId}`, payloadUpdate);
      } else {
        // Crear nuevo empleado (POST)
        // Asegurar que el ID del rol sea un número entero
        const rolId = Number.parseInt(String(formData.rol_id), 10);
        const payloadCreate = {
          persona: {
            nombre: formData.nombre,
            apellido: formData.apellido,
            email: formData.email,
            tipo_documento_id: 1,
            numero_documento: formData.numero_documento,
            fecha_nacimiento: formData.fecha_nacimiento,
          },
          username: formData.username,
          password: formData.password,
          codigo_empleado: formData.codigo_empleado,
          fecha_contratacion: formData.fecha_contratacion,
          rol_id: rolId, // ID del rol seleccionado como entero
        };

        await axios.post("/api/empleados", payloadCreate);
      }

      await loadEmpleados();
      setShowModal(false);
      setEditingId(null);
      setFormData({ ...initialFormData, rol_id: null });
      setFormErrors({});
    } catch (err: any) {
      let message = editingId
        ? "Error al actualizar el empleado. Por favor, intenta nuevamente."
        : "Error al crear el empleado. Por favor, intenta nuevamente.";
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
      setIsSaving(false);
    }
  };

  return (
    <Page title="Configuración de Empleados">
      <div className="flex w-full flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-dark-50">
              Empleados
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-200">
              Consulta y gestiona los empleados de tu negocio
            </p>
          </div>

          <Button
            color="primary"
            className="flex items-center gap-2"
            onClick={handleOpenModal}
          >
            Nuevo Empleado
          </Button>
        </div>

        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <GhostSpinner className="size-8" variant="soft" />
                <p className="text-sm text-gray-500 dark:text-dark-200">
                  Cargando empleados...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="rounded-lg bg-error/10 p-4 text-sm text-error dark:bg-error/20 dark:text-error-light">
                {error}
              </div>
              <Button
                onClick={loadEmpleados}
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
                      Nombre y Apellido
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-200">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-200">
                      Teléfono
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-200">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-200">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {empleados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-gray-500 dark:text-dark-200"
                      >
                        No hay empleados registrados
                      </td>
                    </tr>
                  ) : (
                    empleados.map((empleado) => (
                      <tr
                        key={empleado.id}
                        className="border-b border-gray-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800"
                      >
                        <td className="px-4 py-3 text-gray-800 dark:text-dark-50">
                          {empleado.nombre} {empleado.apellido}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-dark-200">
                          {empleado.email || (
                            <span className="italic text-gray-400 dark:text-dark-400">
                              Sin email
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-dark-200">
                          {empleado.telefono || (
                            <span className="italic text-gray-400 dark:text-dark-400">
                              Sin teléfono
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-dark-200">
                          {empleado.activo ? "Activo" : "Inactivo"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="flat"
                            color="primary"
                            isIcon
                            className="size-8"
                            onClick={() => handleEditEmpleado(empleado.id)}
                            data-tooltip
                            data-tooltip-content="Editar empleado"
                          >
                            <TbEdit className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Modal crear empleado */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={handleCloseModal}
          >
            <Card
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto shadow-xl bg-white dark:bg-dark-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-dark-50">
                  {editingId ? "Editar Empleado" : "Nuevo Empleado"}
                </h2>

                {error && (
                  <div className="mb-4 rounded-lg bg-error/10 p-3 text-sm text-error dark:bg-error/20 dark:text-error-light">
                    {error}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Nombre"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    error={formErrors.nombre}
                    required
                  />
                  <Input
                    label="Apellido"
                    value={formData.apellido}
                    onChange={(e) =>
                      setFormData({ ...formData, apellido: e.target.value })
                    }
                    error={formErrors.apellido}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    error={formErrors.email}
                    required
                  />
                  <Input
                    label="Número de Documento"
                    value={formData.numero_documento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numero_documento: e.target.value,
                      })
                    }
                    error={formErrors.numero_documento}
                    required
                  />
                  <Input
                    label="Fecha de Nacimiento"
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fecha_nacimiento: e.target.value,
                      })
                    }
                    error={formErrors.fecha_nacimiento}
                    required
                  />
                  {!editingId && (
                    <>
                      <Input
                        label="Username"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        error={formErrors.username}
                        required
                      />
                      <Input
                        label="Password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            password: e.target.value,
                          })
                        }
                        error={formErrors.password}
                        required
                      />
                    </>
                  )}
                  <Input
                    label="Código de Empleado"
                    value={formData.codigo_empleado}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        codigo_empleado: e.target.value,
                      })
                    }
                    error={formErrors.codigo_empleado}
                    required
                  />
                  <Input
                    label="Fecha de Contratación"
                    type="date"
                    value={formData.fecha_contratacion}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fecha_contratacion: e.target.value,
                      })
                    }
                    error={formErrors.fecha_contratacion}
                    required
                  />
                  {/* Teléfono no viene como campo editable separado en el backend de empleados,
                      si en el futuro se expone para edición se puede reactivar este campo. */}
                </div>

                {/* Selector de roles - Solo al crear */}
                {!editingId && (
                  <div className="mt-4">
                    <label className="input-label mb-2 block text-sm font-medium text-gray-700 dark:text-dark-200">
                      Roles <span className="text-error">*</span>
                    </label>
                    {isLoadingRoles ? (
                      <div className="flex items-center gap-2 py-2">
                        <GhostSpinner className="size-4" variant="soft" />
                        <span className="text-sm text-gray-500 dark:text-dark-300">
                          Cargando roles...
                        </span>
                      </div>
                    ) : availableRoles.length === 0 ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-600 dark:bg-dark-800">
                        <p className="text-sm text-gray-500 dark:text-dark-300">
                          No hay roles disponibles
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-600 dark:bg-dark-800 md:grid-cols-2">
                        {availableRoles.map((role) => {
                          const roleId = Number.parseInt(String(role.id), 10);
                          return (
                            <Checkbox
                              key={roleId}
                              label={role.name}
                              checked={formData.rol_id === roleId}
                              onChange={(e) => {
                                // Solo permitir seleccionar un rol a la vez
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    rol_id: roleId,
                                  });
                                } else {
                                  // Si se desmarca, limpiar la selección
                                  setFormData({
                                    ...formData,
                                    rol_id: null,
                                  });
                                }
                              }}
                              color="primary"
                            />
                          );
                        })}
                      </div>
                    )}
                    {formErrors.rol_id && (
                      <p className="mt-1 text-sm text-error dark:text-error-light">
                        {formErrors.rol_id}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    onClick={handleCloseModal}
                    variant="flat"
                    color="neutral"
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    color="primary"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <div className="flex items-center gap-2">
                        <GhostSpinner className="size-4" variant="soft" />
                        <span>{editingId ? "Actualizando..." : "Guardando..."}</span>
                      </div>
                    ) : editingId ? (
                      "Actualizar"
                    ) : (
                      "Crear Empleado"
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

