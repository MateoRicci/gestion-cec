import { Navigate, useLocation } from "react-router";
import { ReactNode } from "react";
import { useAuthStore } from "@/stores/authStore";
import { userHasModuleAccess, ModuleId } from "@/configs/roles";

interface RoleGuardProps {
  children: ReactNode;
  requiredModule: ModuleId;
  redirectTo?: string;
}

/**
 * Guard que protege rutas según los roles del usuario
 * Si el usuario no tiene acceso al módulo requerido, redirige a la página de inicio
 */
export default function RoleGuard({
  children,
  requiredModule,
  redirectTo = "/dashboards/home",
}: RoleGuardProps) {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  // Si no hay usuario, redirigir al login (AuthGuard debería manejar esto primero)
  if (!user || !user.roles || user.roles.length === 0) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar si el usuario tiene acceso al módulo requerido
  const hasAccess = userHasModuleAccess(user.roles, requiredModule);

  if (!hasAccess) {
    // Redirigir a la página de inicio si no tiene acceso
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

