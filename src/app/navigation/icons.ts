import { TbPalette, TbSettings, TbBuildingStore, TbPackage, TbShoppingCart } from "react-icons/tb";
import { UserIcon as HiUserIcon } from "@heroicons/react/24/outline";
import { ElementType } from "react";

import CECLogo from "@/components/shared/CECLogo";

export const navigationIcons: Record<string, ElementType> = {
  dashboards: CECLogo,
  settings: CECLogo,
  "dashboards.home": CECLogo,
  "dashboards.ventas": TbShoppingCart,
  "dashboards.configuraciones": TbSettings,
  "dashboards.configuraciones.puntosVenta": TbBuildingStore,
  "dashboards.configuraciones.productos": TbPackage,
  "settings.general": HiUserIcon,
  "settings.appearance": TbPalette,
};
