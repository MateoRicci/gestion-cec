// Import Dependencies
import { useEffect, ReactNode } from "react";

// Local Imports
import axios from "@/utils/axios";
import { AuthProvider as AuthContext } from "./context";
import { useAuthStore } from "@/stores/authStore";

// ----------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    errorMessage,
    setUser,
    setAuthenticated,
    setLoading,
    setInitialized,
    setErrorMessage,
    logout: logoutStore,
  } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      try {
        // Si hay usuario persistido, verificar que la sesión sigue válida
        if (user && isAuthenticated) {
          try {
            // Hacer una request al backend para validar que la cookie/sesión sigue válida
            // Si el token está vencido, el backend responderá 401 y el interceptor de axios
            // manejará el logout y redirección automáticamente
            await axios.get("/api/empleados/me");

            // Si la request fue exitosa, la sesión es válida
            setInitialized(true);
            return;
          } catch (error: any) {
            // Si es error 401, el interceptor de axios ya manejó el logout y redirección
            // Solo necesitamos evitar continuar con la inicialización
            if (error?.response?.status === 401) {
              return; // El interceptor ya está redirigiendo
            }

            // Para otros errores (red, servidor caído, etc.), mantener el estado actual
            // para permitir que el usuario vea la app mientras se resuelve
            console.warn("Error al verificar sesión:", error);
            setInitialized(true);
            return;
          }
        }

        // Si no hay usuario persistido, no está autenticado
        setAuthenticated(false);
        setInitialized(true);
      } catch (err) {
        console.error(err);
        setInitialized(true);
      }
    };

    if (!isInitialized) {
      init();
    }
  }, [isInitialized, user, isAuthenticated, setAuthenticated, setInitialized]);

  const login = async (credentials: { username: string; password: string }) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // El login ahora maneja cookies automáticamente (access_token se guarda en cookie)
      // y devuelve los datos del usuario
      const response = await axios.post<{ user: any }>(
        "/api/login",
        credentials,
      );

      if (!response.data?.user) {
        throw new Error("Response is not valid");
      }

      // Guardar el usuario en el store (se filtra automáticamente para excluir campos de tiempo)
      // La cookie access_token se maneja automáticamente por el navegador
      setUser(response.data.user);
      setAuthenticated(true);
      setLoading(false);
    } catch (err: any) {
      console.error("Login error completo:", {
        message: err?.message,
        code: err?.code,
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        config: {
          url: err?.config?.url,
          baseURL: err?.config?.baseURL,
          method: err?.config?.method,
        }
      });

      let errorMessage = "Login failed";

      if (err?.response?.status === 404) {
        errorMessage = "Endpoint no encontrado. Verifica la URL del backend.";
      } else if (err?.code === "ERR_NETWORK" || err?.message?.includes("CORS") || err?.code === "ERR_CORS") {
        errorMessage = "Error de conexión. El backend no permite solicitudes CORS desde este origen. El backend debe configurar los headers CORS.";
      } else if (err?.response?.data) {
        errorMessage = typeof err.response.data === "string"
          ? err.response.data
          : err.response.data.message || JSON.stringify(err.response.data);
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setErrorMessage(errorMessage);
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Llamar al endpoint de logout del backend para limpiar la cookie
      await axios.post("/api/logout");
      // console.log("Logout response:", response);
    } catch (err) {
      console.error("Error al hacer logout:", err);
      // Continuar con el logout local aunque falle el backend
    }

    // Limpiar localStorage completamente
    localStorage.clear();

    // Limpiar el store de Zustand (esto también limpia su parte del localStorage)
    logoutStore();

    // Redirigir al login después de cerrar sesión
    window.location.href = "/login";
  };

  if (!children) {
    return null;
  }

  return (
    <AuthContext
      value={{
        user,
        isAuthenticated,
        isLoading,
        isInitialized,
        errorMessage,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext>
  );
}
