import { baseNavigationObj } from "../baseNavigation";
import { NavigationTree } from "@/@types/navigation";

const ROOT_DASHBOARDS = "/dashboards";

const path = (root: string, item: string) => `${root}${item}`;

export const dashboards: NavigationTree = {
  ...baseNavigationObj["dashboards"],
  type: "root",
  childs: [
    {
      id: "dashboards.home",
      path: path(ROOT_DASHBOARDS, "/home"),
      type: "item",
      title: "Inicio",
      transKey: "nav.dashboards.home",
      icon: "dashboards.home",
    },
    {
      id: "dashboards.ventas",
      path: path(ROOT_DASHBOARDS, "/ventas"),
      type: "item",
      title: "Ventas",
      transKey: "nav.dashboards.ventas",
      icon: "dashboards.ventas",
    },
    {
      id: "dashboards.configuraciones",
      path: path(ROOT_DASHBOARDS, "/configuraciones"),
      type: "collapse",
      title: "Configuraciones",
      transKey: "nav.dashboards.configuraciones",
      icon: "dashboards.configuraciones",
      childs: [
        {
          id: "dashboards.configuraciones.puntos-venta",
          path: path(ROOT_DASHBOARDS, "/configuraciones/puntos-venta"),
          type: "item",
          title: "Puntos de Venta",
          transKey: "nav.dashboards.configuraciones.puntosVenta",
          icon: "dashboards.configuraciones.puntosVenta",
        },
        {
          id: "dashboards.configuraciones.productos",
          path: path(ROOT_DASHBOARDS, "/configuraciones/productos"),
          type: "item",
          title: "Productos",
          transKey: "nav.dashboards.configuraciones.productos",
          icon: "dashboards.configuraciones.productos",
        },
      ],
    },
  ],
};
