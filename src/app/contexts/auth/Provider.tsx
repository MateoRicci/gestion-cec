// Import Dependencies
import { useEffect, ReactNode } from "react";

// Local Imports
import axios from "@/utils/axios";
import { AuthProvider as AuthContext, AuthContextType } from "./context";
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
        // Si hay usuario persistido, asumimos que está autenticado (la cookie se verifica en cada request)
        // Si no hay usuario persistido, el usuario no está autenticado
        if (user && isAuthenticated) {
          // Usuario ya persistido, mantener autenticado
          setInitialized(true);
          return;
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

  const login = async (credentials: { usuario: string; password: string }) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // El login ahora maneja cookies automáticamente (access_token se guarda en cookie)
      // y devuelve los datos del usuario
      const response = await axios.post<{ user: any }>(
        "/auth/login",
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
      await axios.post("/auth/logout");
    } catch (err) {
      console.error("Error al hacer logout:", err);
      // Continuar con el logout local aunque falle el backend
    }
    
    // Limpiar el store de Zustand (incluye localStorage)
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
