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
  punto_venta_id: number;
  usuario_id: number;
  fecha_apertura: string;
  fecha_cierre: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
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
  isLoadingCaja: boolean;
  refreshCajaEstado: () => Promise<void>;
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
  const [isLoadingCaja, setIsLoadingCaja] = useState(true);
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

  // Función para verificar el estado de la caja abierta
  const verificarCajaAbierta = async () => {
    setIsLoadingCaja(true);
    
    try {
      // El endpoint devuelve {} si no hay caja abierta, o un objeto Caja si hay una abierta
      const response = await axios.get<Caja | {}>("/api/cajas/abierta");
      
      // Verificar si la respuesta tiene datos de caja (no es un objeto vacío)
      if (response.data && typeof response.data === 'object' && 'id' in response.data) {
        const caja = response.data as Caja;
        // Si hay una caja abierta, guardar su ID para el punto de venta correspondiente
        setCajaIdPorPuntoVenta(caja.punto_venta_id.toString(), caja.id);
      } else {
        // No hay caja abierta, limpiar todos los IDs
        setCajaIdPorPuntoVentaState({});
      }
    } catch (error) {
      console.error("Error al verificar caja abierta:", error);
      // En caso de error, asumir que no hay caja abierta
      setCajaIdPorPuntoVentaState({});
    } finally {
      setIsLoadingCaja(false);
    }
  };

  // Cargar puntos de venta desde el API
  useEffect(() => {
    const fetchPuntosDeVenta = async () => {
      try {
        setIsLoadingPuntosDeVenta(true);
        const response = await axios.get<PuntoDeVenta[]>("/api/puntos-venta");
        
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

  // Verificar estado de caja abierta al montar
  useEffect(() => {
    verificarCajaAbierta();
  }, []);

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
        isLoadingCaja,
        refreshCajaEstado: verificarCajaAbierta,
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


