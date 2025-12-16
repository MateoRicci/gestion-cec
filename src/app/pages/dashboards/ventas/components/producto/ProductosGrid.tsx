/**
 * Componente para mostrar el grid de productos
 */
import { TbMountain } from "react-icons/tb";
import { Spinner } from "@/components/ui/Spinner";
import { Producto } from "../../types";

interface ProductosGridProps {
  productos: Producto[];
  isLoading: boolean;
  onProductoClick: (producto: Producto) => void;
}

export function ProductosGrid({
  productos,
  isLoading,
  onProductoClick,
}: ProductosGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner color="primary" className="size-8" />
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-dark-600 dark:bg-dark-800">
        <p className="text-gray-500 dark:text-dark-400">
          No hay productos disponibles
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-dark-200">
        Entradas
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {productos.map((producto) => (
          <button
            key={producto.id}
            type="button"
            onClick={() => onProductoClick(producto)}
            className="group flex flex-col rounded-lg border border-gray-200 bg-white p-3 text-left transition-all hover:border-primary-300 hover:shadow-md dark:border-dark-600 dark:bg-dark-800 dark:hover:border-primary-500"
          >
            {/* Imagen placeholder */}
            <div className="mb-2 flex h-24 w-full items-center justify-center rounded bg-gray-100 dark:bg-dark-700">
              <TbMountain className="size-8 text-gray-400" />
            </div>

            {/* Información del producto */}
            <div className="flex-1">
              <h4 className="mb-1 text-sm font-medium text-gray-900 dark:text-dark-50">
                {producto.nombre}
              </h4>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

