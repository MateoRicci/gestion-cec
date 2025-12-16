/**
 * Componente para seleccionar el punto de venta
 */
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { PuntoDeVenta } from "@/app/contexts/ventas/context";

interface PuntoDeVentaSelectorProps {
  puntosDeVenta: PuntoDeVenta[];
  selectedPuntoDeVentaId: string;
  onPuntoDeVentaChange: (pvId: string) => void;
}

export function PuntoDeVentaSelector({
  puntosDeVenta,
  selectedPuntoDeVentaId,
  onPuntoDeVentaChange,
}: PuntoDeVentaSelectorProps) {
  const [showPvDropdown, setShowPvDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentPv =
    puntosDeVenta.find((pv) => pv.id.toString() === selectedPuntoDeVentaId) ||
    puntosDeVenta[0];

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowPvDropdown(false);
      }
    };

    if (showPvDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPvDropdown]);

  return (
    <div className="relative" ref={dropdownRef}>
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
  );
}

