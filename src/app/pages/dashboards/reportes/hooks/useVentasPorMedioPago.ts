import { useState, useEffect, useCallback } from "react";
import axios from "@/utils/axios";

interface MedioPago {
    id: number;
    nombre: string;
    descripcion: string | null;
}

interface Venta {
    id: number;
    monto_total: string;
    medio_pago_id: number;
}

export interface IngresosPorMedioPago {
    medioPagoId: number;
    medioPagoNombre: string;
    totalMonto: number;
}

interface UseVentasPorMedioPagoReturn {
    ingresosPorMedioPago: IngresosPorMedioPago[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useVentasPorMedioPago(
    fechaDesde: string | null,
    fechaHasta: string | null,
    cajaId: number | null = null
): UseVentasPorMedioPagoReturn {
    const [ingresosPorMedioPago, setIngresosPorMedioPago] = useState<IngresosPorMedioPago[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!fechaDesde || !fechaHasta) {
            setIngresosPorMedioPago([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Obtener medios de pago
            const mediosPagoResponse = await axios.get<MedioPago[]>("/api/medios-pago");
            const mediosPagoMap = new Map<number, string>();
            mediosPagoResponse.data.forEach((mp) => {
                mediosPagoMap.set(mp.id, mp.nombre);
            });

            // 2. Obtener ventas con los mismos filtros
            const params: any = {
                fecha_desde: fechaDesde,
                fecha_hasta: fechaHasta,
            };

            if (cajaId) {
                params.caja_id = cajaId;
            }

            const ventasResponse = await axios.get<Venta[]>("/api/ventas", { params });

            // 3. Agrupar montos por medio de pago
            const montosPorMedioPago = new Map<number, number>();

            ventasResponse.data.forEach((venta) => {
                const medioPagoId = venta.medio_pago_id;
                const monto = parseFloat(venta.monto_total) || 0;

                const currentTotal = montosPorMedioPago.get(medioPagoId) || 0;
                montosPorMedioPago.set(medioPagoId, currentTotal + monto);
            });

            // 4. Convertir a array con nombres
            const result: IngresosPorMedioPago[] = Array.from(montosPorMedioPago.entries())
                .map(([medioPagoId, totalMonto]) => ({
                    medioPagoId,
                    medioPagoNombre: mediosPagoMap.get(medioPagoId) || `Medio de Pago ${medioPagoId}`,
                    totalMonto,
                }))
                .filter((item) => item.totalMonto > 0) // Solo mostrar los que tienen montos
                .sort((a, b) => a.medioPagoNombre.localeCompare(b.medioPagoNombre));

            setIngresosPorMedioPago(result);
        } catch (err: any) {
            console.error("Error al obtener ingresos por medio de pago:", err);
            setError(err?.message || "Error al obtener ingresos por medio de pago");
            setIngresosPorMedioPago([]);
        } finally {
            setLoading(false);
        }
    }, [fechaDesde, fechaHasta, cajaId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        ingresosPorMedioPago,
        loading,
        error,
        refetch: fetchData,
    };
}
