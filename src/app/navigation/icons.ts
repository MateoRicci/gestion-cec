import {
  TbPalette,
  TbSettings,
  TbBuildingStore,
  TbPackage,
  TbShoppingCart,
  TbHome,
  TbUsers,
} from "react-icons/tb";
import { UserIcon as HiUserIcon } from "@heroicons/react/24/outline";
import { ElementType } from "react";

import CECLogo from "@/components/shared/CECLogo";

export const navigationIcons: Record<string, ElementType> = {
  dashboards: CECLogo,
  settings: CECLogo,
  "dashboards.home": TbHome,
  "dashboards.ventas": TbShoppingCart,
  "dashboards.configuraciones": TbSettings,
  "dashboards.configuraciones.puntosVenta": TbBuildingStore,
  "dashboards.configuraciones.productos": TbPackage,
  "dashboards.configuraciones.empleados": TbUsers,
  // Reutilizamos el icono de usuarios para Convenios para evitar problemas de exports
  "dashboards.configuraciones.convenios": TbUsers,
  "settings.general": HiUserIcon,
  "settings.appearance": TbPalette,
};
