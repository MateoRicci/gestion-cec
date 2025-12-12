// Import Dependencies
import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import axios from "@/utils/axios";

// ----------------------------------------------------------------------

export type VentasModule = "caja" | "ventas" | string; // "caja", "ventas" o el ID del punto de venta (legacy)

export interface PuntoDeVenta {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Caja {
  id: number;
  nombre: string;
  descripcion: string;
  puntoVentaId: number;
  usuarioId: string;
  fechaApertura: string;
  fechaCierre: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface VentasContextType {
  activeModule: VentasModule;
  setActiveModule: (module: VentasModule) => void;
  puntosDeVenta: PuntoDeVenta[];
  isLoadingPuntosDeVenta: boolean;
  selectedPuntoDeVentaId: string;
  setSelectedPuntoDeVentaId: (pvId: string) => void;
  cajaAbierta: boolean;
  setCajaAbierta: (open: boolean) => void;
  cajaIdPorPuntoVenta: Record<string, number>;
  setCajaIdPorPuntoVenta: (puntoVentaId: string, cajaId: number | null) => void;
  getCajaId: (puntoVentaId: string) => number | null;
}

const VentasContext = createContext<VentasContextType | undefined>(undefined);

// ----------------------------------------------------------------------

export function VentasProvider({ children }: { children: ReactNode }) {
  const [activeModule, setActiveModule] = useState<VentasModule>("caja");
  const [puntosDeVenta, setPuntosDeVenta] = useState<PuntoDeVenta[]>([]);
  const [isLoadingPuntosDeVenta, setIsLoadingPuntosDeVenta] = useState(true);
  const [selectedPuntoDeVentaId, setSelectedPuntoDeVentaId] = useState("");
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [cajaIdPorPuntoVenta, setCajaIdPorPuntoVentaState] = useState<
    Record<string, number>
  >({});

  const setCajaIdPorPuntoVenta = (puntoVentaId: string, cajaId: number | null) => {
    setCajaIdPorPuntoVentaState((prev) => {
      if (cajaId === null) {
        const { [puntoVentaId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [puntoVentaId]: cajaId };
    });
  };

  const getCajaId = (puntoVentaId: string): number | null => {
    return cajaIdPorPuntoVenta[puntoVentaId] || null;
  };

  // Cargar puntos de venta desde el API
  useEffect(() => {
    const fetchPuntosDeVenta = async () => {
      try {
        setIsLoadingPuntosDeVenta(true);
        const response = await axios.get<PuntoDeVenta[]>("/puntos-venta");
        
        if (response.data && Array.isArray(response.data)) {
          // Filtrar solo los puntos de venta activos (estado: true)
          const puntosActivos = response.data.filter((pv) => pv.estado === true);
          setPuntosDeVenta(puntosActivos);
          
          // Seleccionar el primer punto de venta por defecto
          if (puntosActivos.length > 0) {
            setSelectedPuntoDeVentaId(puntosActivos[0].id.toString());
          }
        }
      } catch (error) {
        console.error("Error al cargar puntos de venta:", error);
        // En caso de error, mantener array vacío
        setPuntosDeVenta([]);
      } finally {
        setIsLoadingPuntosDeVenta(false);
      }
    };

    fetchPuntosDeVenta();
  }, []);

  // Verificar estado de cajas abiertas para cada punto de venta
  useEffect(() => {
    const verificarCajasAbiertas = async () => {
      if (puntosDeVenta.length === 0) return;

      try {
        // Verificar cajas para cada punto de venta
        const verificaciones = puntosDeVenta.map(async (pv) => {
          try {
            const response = await axios.get<Caja[]>(`/cajas/punto-venta/${pv.id}`);
            
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
              // Obtener la última caja (la más reciente)
              const ultimaCaja = response.data[response.data.length - 1];
              
              // Si fechaCierre es null, hay una caja abierta
              if (ultimaCaja.fechaCierre === null) {
                setCajaIdPorPuntoVenta(pv.id.toString(), ultimaCaja.id);
              }
            }
          } catch (error) {
            console.error(`Error al verificar caja para punto de venta ${pv.id}:`, error);
            // Continuar con los demás puntos de venta aunque uno falle
          }
        });

        await Promise.all(verificaciones);
      } catch (error) {
        console.error("Error al verificar cajas abiertas:", error);
      }
    };

    verificarCajasAbiertas();
  }, [puntosDeVenta]);

  // Actualizar estado de cajaAbierta cuando cambia el punto de venta seleccionado
  useEffect(() => {
    if (selectedPuntoDeVentaId) {
      const cajaId = cajaIdPorPuntoVenta[selectedPuntoDeVentaId];
      setCajaAbierta(cajaId !== undefined && cajaId !== null);
    } else {
      setCajaAbierta(false);
    }
  }, [selectedPuntoDeVentaId, cajaIdPorPuntoVenta]);

  // Asegurar que haya un punto de venta seleccionado cuando se cambia a "ventas"
  useEffect(() => {
    if (activeModule === "ventas" && !selectedPuntoDeVentaId && puntosDeVenta.length > 0) {
      setSelectedPuntoDeVentaId(puntosDeVenta[0].id.toString());
    }
  }, [activeModule, selectedPuntoDeVentaId, puntosDeVenta]);

  return (
    <VentasContext.Provider
      value={{
        activeModule,
        setActiveModule,
        puntosDeVenta,
        isLoadingPuntosDeVenta,
        selectedPuntoDeVentaId,
        setSelectedPuntoDeVentaId,
        cajaAbierta,
        setCajaAbierta,
        cajaIdPorPuntoVenta,
        setCajaIdPorPuntoVenta,
        getCajaId,
      }}
    >
      {children}
    </VentasContext.Provider>
  );
}

export function useVentasContext(): VentasContextType {
  const ctx = useContext(VentasContext);

  if (!ctx) {
    throw new Error("useVentasContext debe usarse dentro de un VentasProvider");
  }

  return ctx;
}


