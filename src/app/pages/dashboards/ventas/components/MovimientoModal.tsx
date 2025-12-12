import { Button, Input, Textarea, GhostSpinner } from "@/components/ui";
import { MovimientoTipo } from "../hooks/useMovimientos";
import { PuntoDeVenta } from "@/app/contexts/ventas/context";

interface MovimientoModalProps {
  show: boolean;
  tipo: MovimientoTipo | null;
  monto: string;
  descripcion: string;
  loading: boolean;
  puntoDeVenta: PuntoDeVenta | undefined;
  onMontoChange: (monto: string) => void;
  onDescripcionChange: (descripcion: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

// Función para formatear número entero con separadores de miles
function formatNumberWithSeparators(value: string): string {
  if (!value) return "";
  
  // Remover todo excepto números
  const cleaned = value.replace(/\D/g, "");
  
  // Si está vacío después de limpiar, retornar vacío
  if (!cleaned) return "";
  
  // Agregar puntos cada 3 cifras (separadores de miles)
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Función para parsear el valor formateado a número entero (sin puntos)
function parseFormattedNumber(value: string): string {
  if (!value) return "";
  
  // Remover todos los puntos (separadores de miles) y cualquier otro carácter no numérico
  return value.replace(/\D/g, "");
}

export function MovimientoModal({
  show,
  tipo,
  monto,
  descripcion,
  loading,
  puntoDeVenta,
  onMontoChange,
  onDescripcionChange,
  onCancel,
  onConfirm,
}: MovimientoModalProps) {
  if (!show || !tipo || !puntoDeVenta) return null;

  // Valor formateado para mostrar
  const formattedValue = monto ? formatNumberWithSeparators(monto) : "";

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Si está vacío, permitir borrar
    if (inputValue === "") {
      onMontoChange("");
      return;
    }
    // Parsear y actualizar el valor sin formato
    const parsed = parseFormattedNumber(inputValue);
    onMontoChange(parsed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-gray-900 p-5 text-sm text-gray-100 shadow-xl dark:bg-dark-700">
        <h3 className="text-lg font-semibold">
          {tipo === "ingreso" ? "Ingresar efectivo" : "Retirar efectivo"}
        </h3>
        <p className="mt-1 text-xs text-gray-400">
          Punto de venta seleccionado: {puntoDeVenta.nombre}
        </p>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="block text-xs text-gray-400">Monto</label>
            <Input
              unstyled
              type="text"
              inputMode="numeric"
              value={formattedValue}
              onChange={handleMontoChange}
              placeholder="0"
              className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-gray-400">
              Descripción (opcional)
            </label>
            <Textarea
              unstyled
              value={descripcion}
              onChange={(e) => onDescripcionChange(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800"
              placeholder={
                tipo === "ingreso"
                  ? "Ingreso de efectivo"
                  : "Retiro de efectivo"
              }
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            color="neutral"
            variant="flat"
            className="h-8 px-3 text-xs"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            className="h-8 px-3 text-xs space-x-2"
            onClick={onConfirm}
            disabled={!monto || parseInt(monto.replace(/\D/g, ""), 10) <= 0 || loading}
          >
            {loading && <GhostSpinner variant="soft" className="size-3 border-2" />}
            <span>Confirmar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

