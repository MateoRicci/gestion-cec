import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { JWT_HOST_API } from "@/configs/auth";

const axiosInstance = axios.create({
  baseURL: JWT_HOST_API,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Permite enviar y recibir cookies automáticamente
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Asegurar que Content-Type esté configurado
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // No loguear errores 404 de /auth/me ya que ese endpoint puede no existir
    if (error.config?.url?.includes("/auth/me") && error.response?.status === 404) {
      return Promise.reject(error);
    }

    // Mejor manejo de errores para debugging
    if (error.code === "ERR_NETWORK" || error.message.includes("CORS")) {
      console.error("CORS Error:", error.message);
      return Promise.reject(new Error("Error de conexión. Verifica la configuración CORS del backend."));
    }
    return Promise.reject(error.response?.data || error.message || "Something went wrong");
  }
);

export default axiosInstance;
