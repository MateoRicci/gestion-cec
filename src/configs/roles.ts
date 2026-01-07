import { NavigationTree } from "@/@types/navigation";
import { Role } from "@/@types/user";

/**
 * Configuración de módulos permitidos por rol
 * Define qué módulos puede ver cada rol en la aplicación
 */
export type RoleName =
  | "Admin"
  | "Empleado Venta"
  | "Empleado Administrativo"
  | "Empleado Supervisor"
  | "Cliente"
  | "Proveedor"
  | "Acreedor";

/**
 * IDs de módulos disponibles en la aplicación
 */
export type ModuleId =
  | "dashboards.home"
  | "dashboards.ventas"
  | "dashboards.reportes"
  | "dashboards.reportes.entradas"
  | "dashboards.reportes.movimientos-cajas"
  | "dashboards.configuraciones"
  | "dashboards.configuraciones.puntos-venta"
  | "dashboards.configuraciones.productos"
  | "dashboards.configuraciones.empleados"
  | "dashboards.configuraciones.convenios";

/**
 * Configuración de módulos permitidos por rol
 * - Si un rol tiene acceso a un módulo padre, tiene acceso a todos sus hijos
 * - Si un rol tiene acceso a un módulo hijo específico, solo tiene acceso a ese hijo
 */
export const roleModules: Record<RoleName, ModuleId[]> = {
  // Admin y Empleado Supervisor pueden ver todos los módulos
  "Admin": [
    "dashboards.home",
    "dashboards.ventas",
    "dashboards.reportes",
    "dashboards.reportes.entradas",
    "dashboards.reportes.movimientos-cajas",
    "dashboards.configuraciones",
    "dashboards.configuraciones.puntos-venta",
    "dashboards.configuraciones.productos",
    "dashboards.configuraciones.empleados",
    "dashboards.configuraciones.convenios",
  ],
  "Empleado Supervisor": [
    "dashboards.home",
    "dashboards.ventas",
    "dashboards.reportes",
    "dashboards.reportes.entradas",
    "dashboards.reportes.movimientos-cajas",
    "dashboards.configuraciones",
    "dashboards.configuraciones.puntos-venta",
    "dashboards.configuraciones.productos",
    "dashboards.configuraciones.empleados",
    "dashboards.configuraciones.convenios",
  ],

  // Empleado Venta solo puede ver ventas
  "Empleado Venta": [
    "dashboards.home",
    "dashboards.ventas",
  ],

  // Los demás roles solo pueden ver el home
  "Empleado Administrativo": [
    "dashboards.home",
    "dashboards.reportes",
    "dashboards.reportes.entradas",
    "dashboards.reportes.movimientos-cajas",
  ],
  "Cliente": [
    "dashboards.home",
  ],
  "Proveedor": [
    "dashboards.home",
  ],
  "Acreedor": [
    "dashboards.home",
  ],
};

/**
 * Verifica si un rol tiene acceso a un módulo específico
 */
export function hasModuleAccess(roleName: RoleName, moduleId: ModuleId): boolean {
  const allowedModules = roleModules[roleName] || [];
  return allowedModules.includes(moduleId);
}

/**
 * Verifica si un usuario tiene acceso a un módulo específico
 * Un usuario tiene acceso si al menos uno de sus roles tiene acceso
 */
export function userHasModuleAccess(userRoles: Role[], moduleId: ModuleId): boolean {
  return userRoles.some((role) => {
    const roleName = role.name as RoleName;
    return hasModuleAccess(roleName, moduleId);
  });
}

/**
 * Filtra la navegación según los roles del usuario
 * Elimina los módulos a los que el usuario no tiene acceso
 */
export function filterNavigationByRoles(
  navigation: NavigationTree[],
  userRoles: Role[]
): NavigationTree[] {
  return navigation
    .map((navItem) => {
      // Si el item tiene hijos, filtrar recursivamente
      if (navItem.childs && navItem.childs.length > 0) {
        const filteredChilds = filterNavigationByRoles(navItem.childs, userRoles);

        // Si después de filtrar quedan hijos, incluir el item padre con los hijos filtrados
        if (filteredChilds.length > 0) {
          return { ...navItem, childs: filteredChilds };
        }

        // Si no quedan hijos pero el item padre tiene acceso directo (como módulo root),
        // mantener el item padre con hijos vacíos
        // Esto es útil para módulos root como "dashboards" que siempre deben mostrarse
        if (navItem.type === "root") {
          // Para módulos root, verificar si tiene al menos un hijo con acceso
          // Si no tiene hijos con acceso, no mostrar el módulo root
          return null;
        }

        // Para otros tipos de módulos padre sin hijos con acceso, no incluirlos
        return null;
      }

      // Si el item no tiene hijos, verificar acceso directo
      if (navItem.id && userHasModuleAccess(userRoles, navItem.id as ModuleId)) {
        return navItem;
      }

      return null;
    })
    .filter((item): item is NavigationTree => item !== null);
}

