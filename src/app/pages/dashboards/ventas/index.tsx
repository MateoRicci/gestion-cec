// Import Dependencies
import { Page } from "@/components/shared/Page";
import { VentasProvider } from "@/app/contexts/ventas/context";
import { PuntoDeVentaView } from "./PuntoDeVentaView";

// ----------------------------------------------------------------------

export default function Ventas() {
  return (
    <VentasProvider>
      <Page title="Ventas">
        <div className="transition-content w-full px-(--margin-x) pt-4 lg:pt-5">
          <PuntoDeVentaView />
        </div>
      </Page>
    </VentasProvider>
  );
}
