// Import Dependencies
import { Page } from "@/components/shared/Page";
import { ReporteIngresos } from "./components/ReporteIngresos";

// ----------------------------------------------------------------------

export default function Reportes() {
  return (
    <Page title="Reportes">
      <div className="transition-content w-full px-(--margin-x) pt-4 lg:pt-5">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Reportes
          </h2>
          <div className="mt-6">
            <ReporteIngresos />
          </div>
        </div>
      </div>
    </Page>
  );
}

