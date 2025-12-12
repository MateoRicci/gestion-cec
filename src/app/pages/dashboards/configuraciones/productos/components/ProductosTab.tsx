// Import Dependencies
import { useState, useEffect } from "react";
import { Button, Input, Textarea, Card, GhostSpinner, Checkbox } from "@/components/ui";
import { TbPlus, TbEdit, TbTrash, TbPackage, TbCurrencyDollar } from "react-icons/tb";
import axios from "@/utils/axios";

// ----------------------------------------------------------------------

interface Categoria {
  id: number;
  nombre: string;
}

interface PuntoDeVenta {
  id: number;
  nombre: string;
}

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

interface ProductoPrecioResponse {
  id: number;
  listaPrecioId: number;
  productoId: number;
  precio: number;
  tipoMonedaId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  listaPrecio: {
    id: number;
    nombre: string;
    descripcion: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  };
}

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  codigoProducto: number;
  controlaStock?: boolean;
  puntosVenta?: PuntoDeVenta[];
  categorias?: Categoria[];
}

interface ProductoResponse {
  id: number;
  nombre: string;
  descripcion: string;
  codigoProducto: number;
  controlaStock?: boolean;
  puntosVenta?: Array<{ id: number; nombre: string }>;
  categorias?: Array<{ id: number; nombre: string }>;
}

interface ProductoFormData {
  nombre: string;
  descripcion: string;
  codigoProducto: string;
  controlaStock: boolean;
  puntosVenta: number[];
  categorias: number[];
}

const initialFormData: ProductoFormData = {
  nombre: "",
  descripcion: "",
  codigoProducto: "",
  controlaStock: false,
  puntosVenta: [],
  categorias: [],
};

export function ProductosTab() {
  // Estado para los productos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [puntosVenta, setPuntosVenta] = useState<PuntoDeVenta[]>([]);
  const [listasPrecios, setListasPrecios] = useState<ListaPrecios[]>([]);

  // Estado para el modal de crear/editar
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProductoFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<ProductoFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  // Estado para el modal de configurar precios
  const [showPreciosModal, setShowPreciosModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [precios, setPrecios] = useState<Record<number, string>>({});
  const [isLoadingPrecios, setIsLoadingPrecios] = useState(false);
  const [isLoadingPreciosExistentes, setIsLoadingPreciosExistentes] = useState(false);
  const [errorPrecios, setErrorPrecios] = useState<string | null>(null);

  // Función para cargar los productos desde el backend
  const loadProductos = async () => {
    setIsLoadingList(true);
    setListError(null);

    try {
      const response = await axios.get<ProductoResponse[]>("/productos");
      
      // Mapear la respuesta
      const productosMapeados: Producto[] = response.data.map((prod) => ({
        id: prod.id,
        nombre: prod.nombre,
        descripcion: prod.descripcion || "",
        codigoProducto: prod.codigoProducto,
        controlaStock: prod.controlaStock || false,
        puntosVenta: prod.puntosVenta || [],
        categorias: prod.categorias || [],
      }));

      setProductos(productosMapeados);
    } catch (err: any) {
      console.error("Error al cargar productos:", err);
      
      let errorMessage = "Error al cargar los productos. Por favor, intenta nuevamente.";
      
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

  // Función para cargar las categorías
  const loadCategorias = async () => {
    try {
      const response = await axios.get<Categoria[]>("/categorias-producto");
      setCategorias(response.data);
    } catch (err: any) {
      console.error("Error al cargar categorías:", err);
    }
  };

  // Función para cargar los puntos de venta
  const loadPuntosVenta = async () => {
    try {
      const response = await axios.get<PuntoDeVenta[]>("/puntos-venta");
      setPuntosVenta(response.data);
    } catch (err: any) {
      console.error("Error al cargar puntos de venta:", err);
    }
  };

  // Función para cargar las listas de precios
  const loadListasPrecios = async () => {
    try {
      const response = await axios.get<ListaPreciosResponse[]>("/lista-precios");
      
      // Mapear la respuesta correctamente
      const listasMapeadas: ListaPrecios[] = response.data.map((lista) => ({
        id: lista.id,
        nombre: lista.nombre,
        descripcion: lista.descripcion || "",
      }));
      
      setListasPrecios(listasMapeadas);
    } catch (err: any) {
      console.error("Error al cargar listas de precios:", err);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadProductos();
    loadCategorias();
    loadPuntosVenta();
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
  const handleEdit = (producto: Producto) => {
    setEditingId(producto.id);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || "",
      codigoProducto: producto.codigoProducto.toString(),
      controlaStock: producto.controlaStock || false,
      puntosVenta: producto.puntosVenta?.map(pv => pv.id) || [],
      categorias: producto.categorias?.map(cat => cat.id) || [],
    });
    setFormErrors({});
    setError(null);
    setShowModal(true);
  };

  // Función para eliminar un producto
  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      return;
    }

    try {
      await axios.delete(`/productos/${id}`);
      
      // Recargar la lista después de eliminar
      await loadProductos();
    } catch (err: any) {
      console.error("Error al eliminar producto:", err);
      
      let errorMessage = "Error al eliminar el producto. Por favor, intenta nuevamente.";
      
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
    const errors: Partial<ProductoFormData> = {};

    if (!formData.nombre.trim()) {
      errors.nombre = "El nombre es requerido";
    }

    if (!formData.codigoProducto.trim()) {
      errors.codigoProducto = "El código de producto es requerido";
    } else if (isNaN(parseInt(formData.codigoProducto)) || parseInt(formData.codigoProducto) < 0) {
      errors.codigoProducto = "El código debe ser un número válido";
    }

    if (formData.categorias.length === 0) {
      errors.categorias = "Debe seleccionar al menos una categoría";
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
      const payload = {
        nombre: formData.nombre,
        codigoProducto: parseInt(formData.codigoProducto),
        descripcion: formData.descripcion,
        controlaStock: formData.controlaStock,
        puntosVenta: formData.puntosVenta,
        categorias: formData.categorias,
      };

      if (editingId) {
        // Editar producto existente
        await axios.patch(`/productos/${editingId}`, payload);

        // Recargar la lista después de editar
        await loadProductos();

        setShowModal(false);
        setFormData(initialFormData);
        setEditingId(null);
      } else {
        // Crear nuevo producto
        await axios.post("/productos", payload);

        // Recargar la lista después de crear
        await loadProductos();

        setShowModal(false);
        setFormData(initialFormData);
        setEditingId(null);
      }
    } catch (err: any) {
      console.error("Error al guardar producto:", err);
      
      // Manejar errores
      let errorMessage = "Error al guardar el producto. Por favor, intenta nuevamente.";
      
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

  // Función para manejar selección de puntos de venta
  const handlePuntoVentaToggle = (puntoVentaId: number) => {
    setFormData(prev => {
      const isSelected = prev.puntosVenta.includes(puntoVentaId);
      return {
        ...prev,
        puntosVenta: isSelected
          ? prev.puntosVenta.filter(id => id !== puntoVentaId)
          : [...prev.puntosVenta, puntoVentaId]
      };
    });
  };

  // Función para manejar selección de categorías
  const handleCategoriaToggle = (categoriaId: number) => {
    setFormData(prev => {
      const isSelected = prev.categorias.includes(categoriaId);
      return {
        ...prev,
        categorias: isSelected
          ? prev.categorias.filter(id => id !== categoriaId)
          : [...prev.categorias, categoriaId]
      };
    });
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

  // Función para abrir el modal de configurar precios
  const handleConfigurarPrecios = async (producto: Producto) => {
    setProductoSeleccionado(producto);
    setErrorPrecios(null);
    setIsLoadingPreciosExistentes(true);
    
    // Asegurarse de que las listas de precios estén cargadas
    let listasActuales = listasPrecios;
    if (listasActuales.length === 0) {
      try {
        const response = await axios.get<ListaPreciosResponse[]>("/lista-precios");
        listasActuales = response.data.map((lista) => ({
          id: lista.id,
          nombre: lista.nombre,
          descripcion: lista.descripcion || "",
        }));
        setListasPrecios(listasActuales);
      } catch (err: any) {
        console.error("Error al cargar listas de precios:", err);
        setErrorPrecios("Error al cargar las listas de precios");
        setIsLoadingPreciosExistentes(false);
        return;
      }
    }
    
    // Inicializar precios vacíos para cada lista
    const preciosIniciales: Record<number, string> = {};
    listasActuales.forEach(lista => {
      preciosIniciales[lista.id] = "";
    });
    
    // Cargar precios existentes del producto
    try {
      const response = await axios.get<ProductoPrecioResponse[]>(`/productos/precios/producto/${producto.id}`);
      
      // Mapear los precios existentes al formato del estado
      response.data.forEach((precioData) => {
        if (precioData.listaPrecioId && precioData.precio !== null && precioData.precio !== undefined) {
          preciosIniciales[precioData.listaPrecioId] = precioData.precio.toString();
        }
      });
      
      setPrecios(preciosIniciales);
    } catch (err: any) {
      console.error("Error al cargar precios existentes:", err);
      // Si hay error, continuar con precios vacíos
      setPrecios(preciosIniciales);
    } finally {
      setIsLoadingPreciosExistentes(false);
      setShowPreciosModal(true);
    }
  };

  // Función para cerrar el modal de precios
  const handleClosePreciosModal = () => {
    if (isLoadingPrecios || isLoadingPreciosExistentes) return;
    setShowPreciosModal(false);
    setProductoSeleccionado(null);
    setPrecios({});
    setErrorPrecios(null);
    setIsLoadingPreciosExistentes(false);
  };

  // Función para guardar los precios
  const handleGuardarPrecios = async () => {
    if (!productoSeleccionado) return;

    setIsLoadingPrecios(true);
    setErrorPrecios(null);

    try {
      // Guardar precio para cada lista de precios que tenga un valor
      const promesas = Object.entries(precios)
        .filter(([_, precio]) => precio.trim() !== "")
        .map(async ([listaPrecioId, precio]) => {
          const precioNumero = parseFloat(precio);
          if (isNaN(precioNumero) || precioNumero < 0) {
            throw new Error(`El precio para la lista ${listaPrecioId} no es válido`);
          }

          // Usar POST para agregar el precio según el ID de la lista
          await axios.post("/lista-precios/agregar-producto", {
            listaPrecioId: parseInt(listaPrecioId),
            productoId: productoSeleccionado.id,
            precio: precioNumero,
            tipoMonedaId: 1, // Por defecto, ajustar si es necesario
          });
        });

      await Promise.all(promesas);
      
      // Cerrar el modal después de guardar
      handleClosePreciosModal();
      
      // Opcional: recargar productos si es necesario
      // await loadProductos();
    } catch (err: any) {
      console.error("Error al guardar precios:", err);
      
      let errorMessage = "Error al guardar los precios. Por favor, intenta nuevamente.";
      
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
      
      setErrorPrecios(errorMessage);
    } finally {
      setIsLoadingPrecios(false);
    }
  };

  return (
    <div className="flex w-full flex-col">
      {/* Header con botón de crear */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
            Productos
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-200">
            Gestiona el inventario de productos
          </p>
        </div>
        <Button
          onClick={handleCreate}
          color="primary"
          className="flex items-center gap-2"
        >
          <TbPlus className="size-4" />
          <span>Nuevo Producto</span>
        </Button>
      </div>

      {/* Tabla de productos */}
      <Card className="overflow-hidden">
        {isLoadingList ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <GhostSpinner className="size-8" variant="soft" />
              <p className="text-sm text-gray-500 dark:text-dark-200">
                Cargando productos...
              </p>
            </div>
          </div>
        ) : listError ? (
          <div className="p-6">
            <div className="rounded-lg bg-error/10 p-4 text-sm text-error dark:bg-error/20 dark:text-error-light">
              {listError}
            </div>
            <Button
              onClick={loadProductos}
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
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-200">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-dark-200">
                      No hay productos registrados
                    </td>
                  </tr>
                ) : (
                  productos.map((producto) => (
                    <tr
                      key={producto.id}
                      className="border-b border-gray-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-600 dark:text-dark-200">
                          {producto.codigoProducto}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TbPackage className="size-4 text-primary-500" />
                          <div>
                            <span className="font-medium text-gray-800 dark:text-dark-50">
                              {producto.nombre}
                            </span>
                            {producto.descripcion && (
                              <p className="text-xs text-gray-500 dark:text-dark-300">
                                {producto.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleConfigurarPrecios(producto)}
                            variant="flat"
                            color="primary"
                            className="flex items-center gap-2"
                            data-tooltip
                            data-tooltip-content="Configurar Precios"
                          >
                            <TbCurrencyDollar className="size-4" />
                            <span className="hidden sm:inline">Configurar Precios</span>
                          </Button>
                          <Button
                            onClick={() => handleEdit(producto)}
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
                            onClick={() => handleDelete(producto.id)}
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
            className="w-full max-w-2xl bg-white shadow-xl dark:bg-dark-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-dark-50">
                {editingId ? "Editar Producto" : "Nuevo Producto"}
              </h2>

              <div className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-error/10 p-3 text-sm text-error dark:bg-error/20 dark:text-error-light">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label="Nombre"
                    placeholder="Ej: Laptop Dell"
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

                  <Input
                    label="Código de Producto"
                    type="number"
                    min="0"
                    placeholder="Ej: 1001"
                    value={formData.codigoProducto}
                    onChange={(e) => {
                      setFormData({ ...formData, codigoProducto: e.target.value });
                      setError(null);
                    }}
                    error={formErrors.codigoProducto}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Textarea
                  label="Descripción"
                  placeholder="Descripción del producto..."
                  value={formData.descripcion}
                  onChange={(e) => {
                    setFormData({ ...formData, descripcion: e.target.value });
                    setError(null);
                  }}
                  rows={3}
                  error={formErrors.descripcion}
                  disabled={isLoading}
                />

                {/* Checkbox Utiliza Stock */}
                <div>
                  <Checkbox
                    label="Utiliza stock"
                    checked={formData.controlaStock}
                    onChange={(e) => {
                      setFormData({ ...formData, controlaStock: e.target.checked });
                      setError(null);
                    }}
                    disabled={isLoading}
                  />
                </div>

                {/* Selección de Categorías */}
                <div>
                  <label className="input-label mb-2 block">
                    Categorías <span className="text-error">*</span>
                  </label>
                  {formErrors.categorias && (
                    <p className="mb-2 text-xs text-error">{formErrors.categorias}</p>
                  )}
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-300 p-3 dark:border-dark-450">
                    {categorias.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-dark-300">
                        No hay categorías disponibles
                      </p>
                    ) : (
                      categorias.map((categoria) => (
                        <label
                          key={categoria.id}
                          className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50 dark:hover:bg-dark-800"
                        >
                          <Checkbox
                            checked={formData.categorias.includes(categoria.id)}
                            onChange={() => handleCategoriaToggle(categoria.id)}
                            disabled={isLoading}
                          />
                          <span className="text-sm text-gray-700 dark:text-dark-200">
                            {categoria.nombre}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Selección de Puntos de Venta */}
                <div>
                  <label className="input-label mb-2 block">
                    Puntos de Venta
                  </label>
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-300 p-3 dark:border-dark-450">
                    {puntosVenta.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-dark-300">
                        No hay puntos de venta disponibles
                      </p>
                    ) : (
                      puntosVenta.map((puntoVenta) => (
                        <label
                          key={puntoVenta.id}
                          className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50 dark:hover:bg-dark-800"
                        >
                          <Checkbox
                            checked={formData.puntosVenta.includes(puntoVenta.id)}
                            onChange={() => handlePuntoVentaToggle(puntoVenta.id)}
                            disabled={isLoading}
                          />
                          <span className="text-sm text-gray-700 dark:text-dark-200">
                            {puntoVenta.nombre}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
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

      {/* Modal de Configurar Precios */}
      {showPreciosModal && productoSeleccionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={handleClosePreciosModal}
        >
          <Card
            className="w-full max-w-2xl bg-white shadow-xl dark:bg-dark-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-dark-50">
                Configurar Precios - {productoSeleccionado.nombre}
              </h2>

              <div className="space-y-4">
                {errorPrecios && (
                  <div className="rounded-lg bg-error/10 p-3 text-sm text-error dark:bg-error/20 dark:text-error-light">
                    {errorPrecios}
                  </div>
                )}

                {isLoadingPreciosExistentes ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center gap-3">
                      <GhostSpinner className="size-6" variant="soft" />
                      <p className="text-sm text-gray-500 dark:text-dark-200">
                        Cargando precios...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {listasPrecios.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-dark-300">
                        No hay listas de precios disponibles
                      </p>
                    ) : (
                      listasPrecios.map((lista) => (
                      <div
                        key={lista.id}
                        className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 dark:border-dark-600"
                      >
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-dark-200">
                            {lista.nombre}
                          </label>
                          {lista.descripcion && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-dark-300">
                              {lista.descripcion}
                            </p>
                          )}
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={precios[lista.id] || ""}
                            onChange={(e) => {
                              setPrecios((prev) => ({
                                ...prev,
                                [lista.id]: e.target.value,
                              }));
                              setErrorPrecios(null);
                            }}
                            disabled={isLoadingPrecios || isLoadingPreciosExistentes}
                            prefix={
                              <span className="text-gray-500 dark:text-dark-300">$</span>
                            }
                          />
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  onClick={handleClosePreciosModal}
                  variant="flat"
                  color="neutral"
                  disabled={isLoadingPrecios || isLoadingPreciosExistentes}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGuardarPrecios}
                  color="primary"
                  disabled={isLoadingPrecios || isLoadingPreciosExistentes}
                >
                  {isLoadingPrecios ? (
                    <div className="flex items-center gap-2">
                      <GhostSpinner className="size-4" variant="soft" />
                      <span>Guardando...</span>
                    </div>
                  ) : (
                    "Guardar Precios"
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

