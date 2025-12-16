/**
 * Vista principal del punto de venta
 * 
 * Esta vista coordina las secciones de caja y ventas.
 * La lógica está separada en componentes modulares para facilitar el mantenimiento.
 */
import { useVentasContext } from "@/app/contexts/ventas/context";
import { CajaSection } from "./components/caja/CajaSection";
import { VentasSection } from "./components/venta/VentasSection";

export function PuntoDeVentaView() {
  const {
    puntosDeVenta,
    selectedPuntoDeVentaId,
    cajaAbierta,
  } = useVentasContext();

  const currentPv =
    puntosDeVenta.find((pv) => pv.id.toString() === selectedPuntoDeVentaId) ||
    puntosDeVenta[0];

  return (
    <section className="flex-1 pt-2">
      {/* Sección de Caja */}
      <CajaSection />

      {/* Sección de Ventas (solo visible si la caja está abierta) */}
      {cajaAbierta && <VentasSection currentPv={currentPv} />}
    </section>
  );
}
