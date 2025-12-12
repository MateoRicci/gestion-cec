import { useState, useEffect } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button, Input } from "@/components/ui";
import { Spinner } from "@/components/ui/Spinner";
import axios from "@/utils/axios";

// ----------------------------------------------------------------------

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
}

interface ProductoPreciosModalProps {
  show: boolean;
  producto: Producto | null;
  onClose: () => void;
  onAgregar: (items: Array<{ listaPrecioId: number; cantidad: number; precio: number; nombreLista: string }>) => void;
}

export function ProductoPreciosModal({
  show,
  producto,
  onClose,
  onAgregar,
}: ProductoPreciosModalProps) {
  const [precioNoSocio, setPrecioNoSocio] = useState<ProductoPrecioResponse | null>(null);
  const [cantidad, setCantidad] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar precios del producto cuando se abre el modal
  useEffect(() => {
    if (show && producto) {
      loadPrecios();
      // Resetear cantidad al abrir
      setCantidad(0);
    }
  }, [show, producto]);

  const loadPrecios = async () => {
    if (!producto) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get<ProductoPrecioResponse[]>(
        `/productos/precios/producto/${producto.id}`
      );
      
      // Buscar la lista de precios de "no socios" (case insensitive)
      const precioNoSocioEncontrado = response.data.find((precio) =>
        precio.listaPrecio.nombre.toLowerCase().includes("no socio")
      );

      if (!precioNoSocioEncontrado) {
        setError("No se encontró la lista de precios de 'No Socios' para este producto");
        setPrecioNoSocio(null);
      } else {
        setPrecioNoSocio(precioNoSocioEncontrado);
      }
    } catch (err: any) {
      console.error("Error al cargar precios:", err);
      setError("Error al cargar las listas de precios del producto");
      setPrecioNoSocio(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCantidadChange = (cantidadValue: number) => {
    const cantidadNum = Math.max(0, cantidadValue);
    setCantidad(cantidadNum);
  };

  const handleAgregar = () => {
    if (!precioNoSocio) {
      setError("No hay precio disponible para agregar");
      return;
    }

    if (cantidad <= 0) {
      setError("Debes ingresar una cantidad mayor a 0");
      return;
    }

    onAgregar([{
      listaPrecioId: precioNoSocio.listaPrecioId,
      cantidad: cantidad,
      precio: precioNoSocio.precio,
      nombreLista: precioNoSocio.listaPrecio.nombre,
    }]);
    onClose();
  };

  if (!producto) return null;

  return (
    <Transition appear show={show} as={Dialog} onClose={onClose}>
      <div className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5">
        <TransitionChild
          as="div"
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="absolute inset-0 bg-gray-900/50 transition-opacity dark:bg-black/40"
        />

        <TransitionChild
          as={DialogPanel}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
          className="scrollbar-sm relative flex w-full max-w-2xl flex-col overflow-y-auto rounded-lg bg-white px-4 py-6 transition-opacity duration-300 dark:bg-dark-700 sm:px-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-dark-600">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-100">
                Agregar Producto - {producto.nombre}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-dark-400">
                Ingresa la cantidad a agregar
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="flat"
              isIcon
              className="size-8 rounded-full"
            >
              <XMarkIcon className="size-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner color="primary" className="size-8" />
              </div>
            ) : error ? (
              <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-center dark:border-error-800 dark:bg-error-900/20">
                <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
              </div>
            ) : !precioNoSocio ? (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-dark-600 dark:bg-dark-800">
                <p className="text-gray-500 dark:text-dark-400">
                  No hay precio de "No Socios" disponible para este producto
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Información del precio */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-dark-600 dark:bg-dark-800">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-dark-50">
                      {precioNoSocio.listaPrecio.nombre}
                    </h4>
                    {precioNoSocio.listaPrecio.descripcion && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-dark-400">
                        {precioNoSocio.listaPrecio.descripcion}
                      </p>
                    )}
                    <p className="mt-3 text-2xl font-bold text-primary-600 dark:text-primary-400">
                      ${precioNoSocio.precio.toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Campo de cantidad */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-dark-200">
                      Cantidad
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={cantidad || ""}
                      onChange={(e) =>
                        handleCantidadChange(parseInt(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="w-full text-center text-lg"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Resumen */}
                {cantidad > 0 && (
                  <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-dark-200">
                        Cantidad: <span className="font-semibold">{cantidad}</span>
                      </span>
                      <span className="text-gray-700 dark:text-dark-200">
                        Precio unitario: <span className="font-semibold">${precioNoSocio.precio.toFixed(2)}</span>
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-primary-300 pt-3 dark:border-primary-700">
                      <p className="text-sm font-semibold text-gray-700 dark:text-dark-200">
                        Total:
                      </p>
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        ${(precioNoSocio.precio * cantidad).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-dark-600">
            <Button variant="outlined" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              color="primary"
              onClick={handleAgregar}
              disabled={!precioNoSocio || cantidad <= 0 || isLoading}
            >
              Agregar al Carrito
            </Button>
          </div>
        </TransitionChild>
      </div>
    </Transition>
  );
}

