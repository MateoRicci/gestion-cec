import { Link } from "react-router";
import { Page } from "@/components/shared/Page";
import { TbShoppingCart } from "react-icons/tb";
import { useAuthStore } from "@/stores/authStore";
import { userHasModuleAccess } from "@/configs/roles";

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const hasVentasAccess = user?.roles 
    ? userHasModuleAccess(user.roles, "dashboards.ventas")
    : false;

  return (
    <Page title="Homepage">
      <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Inicio
          </h2>
          {hasVentasAccess && (
            <div className="mt-6">
              <Link
                to="/dashboards/ventas"
                className="group inline-flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-sm transition-all hover:border-primary-300 hover:bg-primary-50 hover:shadow-md dark:border-dark-600 dark:bg-dark-800 dark:hover:border-primary-500 dark:hover:bg-dark-700"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-colors group-hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400">
                  <TbShoppingCart className="size-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 transition-colors group-hover:text-primary-600 dark:text-dark-50 dark:group-hover:text-primary-400">
                    Módulo de Ventas
                  </div>
                  <div className="text-sm text-gray-500 dark:text-dark-300">
                    Gestiona tus ventas y caja
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
