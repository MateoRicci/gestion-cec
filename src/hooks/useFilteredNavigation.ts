import { useMemo } from "react";
import { navigation } from "@/app/navigation";
import { useAuthStore } from "@/stores/authStore";
import { filterNavigationByRoles } from "@/configs/roles";
import { NavigationTree } from "@/@types/navigation";

/**
 * Hook que retorna la navegación filtrada según los roles del usuario autenticado
 */
export function useFilteredNavigation(): NavigationTree[] {
  const user = useAuthStore((state) => state.user);

  return useMemo(() => {
    if (!user || !user.roles || user.roles.length === 0) {
      // Si no hay usuario o roles, retornar solo el home
      return navigation.filter((nav) => nav.id === "dashboards");
    }

    return filterNavigationByRoles(navigation, user.roles);
  }, [user]);
}

