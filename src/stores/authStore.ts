import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/@types/user";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  errorMessage: string | null;
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setInitialized: (isInitialized: boolean) => void;
  setErrorMessage: (errorMessage: string | null) => void;
  logout: () => void;
}

// Función helper para filtrar campos de tiempo del usuario
const filterUserData = (userData: any): User => {
  const { createdAt, updatedAt, deletedAt, ...userWithoutTimestamps } = userData;
  return userWithoutTimestamps as User;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      errorMessage: null,
      setUser: (user) => set({ user: user ? filterUserData(user) : null }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      setErrorMessage: (errorMessage) => set({ errorMessage }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          errorMessage: null,
        }),
    }),
    {
      name: "auth-storage", // nombre de la clave en localStorage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }), // solo persiste user e isAuthenticated
    }
  )
);

