/**
 * Componente para mostrar el detalle de venta y procesar el cobro
 */
import { Button } from "@/components/ui";
import { Spinner } from "@/components/ui/Spinner";
import { DetalleItem, MedioPago, ClienteData } from "../../types";

interface DetalleVentaProps {
  detalleItems: DetalleItem[];
  mediosPago: MedioPago[];
  isLoadingMediosPago: boolean;
  metodoPagoId: number | null;
  onMetodoPagoChange: (id: number) => void;
  onEliminarItem: (itemId: string) => void;
  onEliminarEntradaSocio: (dni: string) => void;
  onCobrar: () => void;
  isProcesandoVenta: boolean;
  clienteData: ClienteData | null;
  isConsumidorFinal: boolean;
  dni: string;
  familiaresSeleccionados: Set<string>;
  onRestablecer: () => void;
}

export function DetalleVenta({
  detalleItems,
  mediosPago,
  isLoadingMediosPago,
  metodoPagoId,
  onMetodoPagoChange,
  onEliminarItem,
  onEliminarEntradaSocio,
  onCobrar,
  isProcesandoVenta,
  clienteData,
  isConsumidorFinal,
  dni,
  familiaresSeleccionados,
  onRestablecer,
}: DetalleVentaProps) {
  const total = detalleItems.reduce((sum, item) => sum + item.subtotal, 0);

  // Validar condiciones para poder cobrar
  const tieneCliente = clienteData || isConsumidorFinal;
  const tieneDni = dni && dni.length > 0;
  const tieneItems = detalleItems.length > 0;
  const tieneMetodoPago = metodoPagoId !== null;
  
  // Para consumidor final: no necesita familiares seleccionados
  // Para afiliado: necesita al menos un familiar seleccionado
  const familiaresOk = isConsumidorFinal 
    ? true 
    : familiaresSeleccionados.size > 0;

  const puedeCobrar = tieneCliente && tieneDni && tieneItems && tieneMetodoPago && familiaresOk;
  
  // Log para debugging (remover en producción si es necesario)
  if (!puedeCobrar && tieneItems) {
    console.log("No se puede cobrar:", {
      tieneCliente,
      tieneDni,
      tieneItems,
      tieneMetodoPago,
      familiaresOk,
      isConsumidorFinal,
      familiaresSeleccionadosSize: familiaresSeleccionados.size,
      clienteData: !!clienteData,
    });
  }

  const puedeRestablecer = detalleItems.length > 0 || clienteData || dni || isConsumidorFinal;

  return (
    <div className="w-80 shrink-0">
      <div className="sticky top-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-dark-600 dark:bg-dark-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-dark-200">
            Detalle
          </h3>
          <Button
            variant="outlined"
            onClick={onRestablecer}
            disabled={!puedeRestablecer}
            className="text-xs text-[0.8125rem] py-1 px-2"
          >
            Restablecer
          </Button>
        </div>

        {/* Lista de items */}
        <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
          {detalleItems.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-dark-400">
              No hay items en el detalle
            </p>
          ) : (
            detalleItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-600 dark:bg-dark-700"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-dark-50">
                    {item.productoNombre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">
                    {item.nombreLista}:{" "}
                    <span className="font-semibold">{item.cantidad}</span>
                  </p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-dark-300">
                    ${item.precio.toFixed(2)} c/u
                  </p>
                </div>
                <div className="ml-2 flex flex-col items-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (item.id.startsWith("entrada-socio-")) {
                        const dni = item.id.replace("entrada-socio-", "");
                        onEliminarEntradaSocio(dni);
                      } else {
                        onEliminarItem(item.id);
                      }
                    }}
                    className="mb-1 text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
                  >
                    <svg
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <p className="text-sm font-semibold text-gray-900 dark:text-dark-50">
                    ${item.subtotal.toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total */}
        <div className="mb-4 border-t border-gray-200 pt-4 dark:border-dark-600">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 dark:text-dark-200">
              Total:
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-dark-50">
              $
              {Math.round(total).toLocaleString("es-AR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        </div>

        {/* Métodos de pago */}
        <div className="mb-4 space-y-2">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-dark-300">
            Método de Pago
          </h4>
          {isLoadingMediosPago ? (
            <div className="flex items-center justify-center py-4">
              <Spinner className="size-4" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {mediosPago.map((medio) => (
                <button
                  key={medio.id}
                  type="button"
                  onClick={() => onMetodoPagoChange(medio.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${
                    metodoPagoId === medio.id
                      ? "border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/30"
                      : "border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50 dark:border-dark-600 dark:bg-dark-700 dark:hover:border-primary-500"
                  }`}
                >
                  <span className="text-lg">
                    {medio.nombre.toLowerCase().includes("efectivo")
                      ? "💵"
                      : medio.nombre.toLowerCase().includes("tarjeta")
                      ? "💳"
                      : medio.nombre.toLowerCase().includes("transferencia")
                      ? "🏦"
                      : medio.nombre.toLowerCase().includes("mercado")
                      ? "🛒"
                      : medio.nombre.toLowerCase().includes("qr")
                      ? "📱"
                      : "💳"}
                  </span>
                  <span>{medio.nombre}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botón Cobrar */}
        <Button
          color="primary"
          className="w-full"
          disabled={!puedeCobrar || isProcesandoVenta}
          onClick={onCobrar}
        >
          {isProcesandoVenta ? (
            <>
              <Spinner className="mr-2 size-4 border-white" />
              Procesando...
            </>
          ) : (
            <>
              Cobrar
              <span className="ml-2">
                $
                {Math.round(total).toLocaleString("es-AR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </>
          )}
        </Button>
        {!tieneMetodoPago && tieneItems && (
          <p className="mt-2 text-xs text-warning-600 dark:text-warning-400">
            Debe seleccionar un método de pago
          </p>
        )}
        {!clienteData && !isConsumidorFinal && dni && (
          <p className="mt-2 text-xs text-warning-600 dark:text-warning-400">
            Debe buscar y asignar un cliente antes de cobrar
          </p>
        )}
        {clienteData && !isConsumidorFinal && familiaresSeleccionados.size === 0 && (
          <p className="mt-2 text-xs text-warning-600 dark:text-warning-400">
            Debe seleccionar al menos una persona que ingresará
          </p>
        )}
        {!dni && (
          <p className="mt-2 text-xs text-gray-500 dark:text-dark-400">
            Ingrese un DNI y busque el cliente para continuar
          </p>
        )}
      </div>
    </div>
  );
}

