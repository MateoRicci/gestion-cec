import { useState, useEffect, useCallback } from "react";
import axios from "@/utils/axios";

export interface Caja {
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
        }
    }
}

interface UseCajasRangeReturn {
    cajas: Caja[];
    loading: boolean;
    error: string | null;
}

export function useCajasRange(
    fechaDesde: string | null,
    fechaHasta: string | null
): UseCajasRangeReturn {
    const [cajas, setCajas] = useState<Caja[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCajas = useCallback(async () => {
        if (!fechaDesde || !fechaHasta) {
            setCajas([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get<Caja[]>("/api/cajas", {
                params: {
                    fecha_desde: fechaDesde,
                    fecha_hasta: fechaHasta,
                },
            });
            setCajas(response.data);
        } catch (err: any) {
            console.error("Error al obtener cajas:", err);
            setError(err?.message || "Error al obtener cajas");
            setCajas([]);
        } finally {
            setLoading(false);
        }
    }, [fechaDesde, fechaHasta]);

    useEffect(() => {
        fetchCajas();
    }, [fetchCajas]);

    return { cajas, loading, error };
}
