import { Navigate, RouteObject } from "react-router";

import AuthGuard from "@/middleware/AuthGuard";
import RoleGuard from "@/middleware/RoleGuard";
import { DynamicLayout } from "../layouts/DynamicLayout";
import { AppLayout } from "../layouts/AppLayout";

/**
 * Protected routes configuration
 * These routes require authentication to access
 * Uses AuthGuard middleware to verify user authentication
 */
const protectedRoutes: RouteObject = {
  id: "protected",
  Component: AuthGuard,
  children: [
    // The dynamic layout supports both the main layout and the sideblock.
    {
      Component: DynamicLayout,
      children: [
        {
          index: true,
          element: <Navigate to="/dashboards/home" />,
        },
        {
          path: "dashboards",
          children: [
            {
              index: true,
              element: <Navigate to="/dashboards/home" />,
            },
            {
              path: "home",
              lazy: async () => ({
                Component: (await import("@/app/pages/dashboards/home"))
                  .default,
              }),
            },
            {
              path: "ventas",
              lazy: async () => {
                const VentasPage = (await import("@/app/pages/dashboards/ventas"))
                  .default;
                return {
                  Component: () => (
                    <RoleGuard requiredModule="dashboards.ventas">
                      <VentasPage />
                    </RoleGuard>
                  ),
                };
              },
            },
            {
              path: "configuraciones",
              lazy: async () => {
                const ConfiguracionesPage = (
                  await import("@/app/pages/dashboards/configuraciones")
                ).default;
                return {
                  Component: () => (
                    <RoleGuard requiredModule="dashboards.configuraciones">
                      <ConfiguracionesPage />
                    </RoleGuard>
                  ),
                };
              },
              children: [
                {
                  index: true,
                  element: <Navigate to="/dashboards/configuraciones/puntos-venta" />,
                },
                {
                  path: "puntos-venta",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "@/app/pages/dashboards/configuraciones/puntos-venta"
                      )
                    ).default,
                  }),
                },
                {
                  path: "productos",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "@/app/pages/dashboards/configuraciones/productos"
                      )
                    ).default,
                  }),
                },
                {
                  path: "empleados",
                  lazy: async () => ({
                    Component: (
                      await import(
                        "@/app/pages/dashboards/configuraciones/empleados"
                      )
                    ).default,
                  }),
                },
              ],
            },
          ],
        },
      ],
    },
    // The app layout supports only the main layout. Avoid using it for other layouts.
    {
      Component: AppLayout,
      children: [
        {
          path: "settings",
          lazy: async () => ({
            Component: (await import("@/app/pages/settings/Layout")).default,
          }),
          children: [
            {
              index: true,
              element: <Navigate to="/settings/general" />,
            },
            {
              path: "general",
              lazy: async () => ({
                Component: (
                  await import("@/app/pages/settings/sections/General")
                ).default,
              }),
            },
            {
              path: "appearance",
              lazy: async () => ({
                Component: (
                  await import("@/app/pages/settings/sections/Appearance")
                ).default,
              }),
            },
          ],
        },
      ],
    },
  ],
};

export { protectedRoutes };
