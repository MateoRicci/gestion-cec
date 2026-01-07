// Import Dependencies
import { Page } from "@/components/shared/Page";
import { ReporteMovimientosCajas } from "../components/ReporteMovimientosCajas";

// ----------------------------------------------------------------------

export default function MovimientosCajasPage() {
    return (
        <Page title="Movimientos Cajas">
            <div className="transition-content w-full px-(--margin-x) pt-4 lg:pt-5">
                <div className="min-w-0">
                    <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
                        Movimientos Cajas
                    </h2>
                    <div className="mt-6">
                        <ReporteMovimientosCajas />
                    </div>
                </div>
            </div>
        </Page>
    );
}
