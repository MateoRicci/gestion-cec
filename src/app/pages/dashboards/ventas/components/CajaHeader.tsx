import { useState } from "react";
import { Button } from "@/components/ui";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { PuntoDeVenta } from "@/app/contexts/ventas/context";

interface CajaHeaderProps {
  puntosDeVenta: PuntoDeVenta[];
  selectedPuntoDeVentaId: string;
  onPuntoDeVentaChange: (pvId: string) => void;
}

export function CajaHeader({
  puntosDeVenta,
  selectedPuntoDeVentaId,
  onPuntoDeVentaChange,
}: CajaHeaderProps) {
  const [showPvDropdown, setShowPvDropdown] = useState(false);

  const currentPv =
    puntosDeVenta.find((pv) => pv.id.toString() === selectedPuntoDeVentaId) ||
    puntosDeVenta[0];

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
          Caja
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-dark-200">
          Aquí podrás ver y gestionar los movimientos de caja.
        </p>
      </div>

      {/* Selector de Punto de Venta */}
      <div className="relative">
        <Button
          color="neutral"
          variant="flat"
          className="flex items-center gap-2 px-3 py-1.5 text-sm"
          onClick={() => setShowPvDropdown((prev) => !prev)}
        >
          <span className="text-gray-400">Punto de venta:</span>
          <span className="font-medium">{currentPv?.nombre}</span>
          <ChevronDownIcon className="size-4 text-gray-400" />
        </Button>

        {showPvDropdown && (
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-gray-200 bg-gray-900/95 p-1 text-sm shadow-lg backdrop-blur dark:border-dark-500 dark:bg-dark-700">
            {puntosDeVenta.map((pv) => (
              <button
                key={pv.id}
                type="button"
                className="flex w-full items-center rounded px-2 py-1.5 text-left text-gray-100 hover:bg-gray-800 dark:hover:bg-dark-600"
                onClick={() => {
                  onPuntoDeVentaChange(pv.id.toString());
                  setShowPvDropdown(false);
                }}
              >
                {pv.nombre}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

