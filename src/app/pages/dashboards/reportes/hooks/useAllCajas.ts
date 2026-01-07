import { useState, useEffect, useCallback } from "react";
import axios from "@/utils/axios";

export interface CajaListItem {
    id: number;
    nombre: string;
    descripcion: string;
    usuario_id: number;
    punto_venta_id: number;
    fecha_apertura: string;
    fecha_cierre: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    usuario: {
        id: number;
        persona_id: string;
        persona: {
            id: string;
            nombre: string;
            apellido: string;
        };
    };
}

interface UseAllCajasReturn {
    cajas: CajaListItem[];
    loading: boolean;
    error: string | null;
}

export function useAllCajas(): UseAllCajasReturn {
    const [cajas, setCajas] = useState<CajaListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCajas = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Obtener todas las cajas cerradas, ordenadas por fecha de cierre descendente
            const response = await axios.get<CajaListItem[]>("/api/cajas", {
                params: {
                    cerradas: true,
                },
            });

            // Ordenar por fecha de cierre descendente (más recientes primero)
            const sortedCajas = response.data.sort((a, b) => {
                const fechaA = a.fecha_cierre ? new Date(a.fecha_cierre).getTime() : 0;
                const fechaB = b.fecha_cierre ? new Date(b.fecha_cierre).getTime() : 0;
                return fechaB - fechaA;
            });

            setCajas(sortedCajas);
        } catch (err: any) {
            console.error("Error al obtener cajas:", err);
            setError(err?.message || "Error al obtener cajas");
            setCajas([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCajas();
    }, [fetchCajas]);

    return { cajas, loading, error };
}
