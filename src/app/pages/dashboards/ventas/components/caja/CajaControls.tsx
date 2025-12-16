import { Button } from "@/components/ui";
import { PuntoDeVenta } from "@/app/contexts/ventas/context";

interface CajaControlsProps {
  cajaAbierta: boolean;
  currentPv: PuntoDeVenta | undefined;
  user: any;
  onAbrirCaja: () => void;
  onCerrarCaja: () => void;
  onIngresarEfectivo: () => void;
  onRetirarEfectivo: () => void;
}

export function CajaControls({
  cajaAbierta,
  currentPv,
  user,
  onAbrirCaja,
  onCerrarCaja,
  onIngresarEfectivo,
  onRetirarEfectivo,
}: CajaControlsProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {cajaAbierta ? (
        <Button
          color="error"
          variant="outlined"
          className="h-9 px-4"
          onClick={onCerrarCaja}
        >
          Cerrar caja
        </Button>
      ) : (
        <Button
          color="success"
          className="h-9 px-4"
          onClick={onAbrirCaja}
          disabled={!currentPv || !user}
        >
          Abrir caja
        </Button>
      )}

      {cajaAbierta && (
        <>
          <Button
            color="primary"
            variant="soft"
            className="h-9 px-4"
            onClick={onIngresarEfectivo}
          >
            Ingresar efectivo
          </Button>
          <Button
            color="warning"
            variant="soft"
            className="h-9 px-4"
            onClick={onRetirarEfectivo}
          >
            Retirar efectivo
          </Button>
        </>
      )}
    </div>
  );
}

