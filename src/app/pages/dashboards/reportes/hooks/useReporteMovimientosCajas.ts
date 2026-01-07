import { useState, useEffect, useCallback } from "react";
import axios from "@/utils/axios";
import { generateTicketCierre } from "@/utils/generateTicketCierre";
import { Caja } from "./useCajasRange";

// Interfaces para los movimientos
export interface MovimientoCajaResponse {
    id: number;
    caja_id: number;
    tipo_movimiento_caja_id: number;
    usuario_id: number;
    monto: string;
    descripcion: string | null;
    accion_movimiento_type: string | null;
    accion_movimiento_id: number | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    tipo_movimiento_caja?: {
        id: number;
        nombre: string;
        descripcion: string | null;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
    } | null;
}

export interface MovimientoCaja {
    id: number;
    monto: number;
    tipoMovimientoCajaId: number;
    tipoMovimientoNombre: string;
    descripcion: string;
    cajaId: number;
    usuarioId: string;
    createdAt: string;
    updatedAt: string;
}

interface MedioPago {
    id: number;
    nombre: string;
}

interface UseReporteMovimientosCajasReturn {
    movimientos: MovimientoCaja[];
    ingresos: number;
    egresos: number;
    total: number;
    loading: boolean;
    error: string | null;
    generarTicket: () => Promise<void>;
    generandoTicket: boolean;
}

// Precios fijos (mismos que en useCajaActions.ts)
const PRECIO_CONVENIO = 0;
const PRECIO_CONVENIO_EMPLEADOS = 4000;
const PRECIO_SIN_CONVENIO = 5000;
const PRECIO_CARPA = 15000;
const PRECIO_MOTORHOME = 25000;
const PRECIO_TURNO_FUTBOL = 35000;

export function useReporteMovimientosCajas(
    caja: Caja | null
): UseReporteMovimientosCajasReturn {
    const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generandoTicket, setGenerandoTicket] = useState(false);

    const cajaId = caja?.id ?? null;

    const fetchMovimientos = useCallback(async () => {
        if (!cajaId) {
            setMovimientos([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get<MovimientoCajaResponse[]>(
                `/api/cajas/${cajaId}/movimientos`
            );

            const processedMovimientos: MovimientoCaja[] = response.data.map((m) => {
                const montoNum = parseFloat(m.monto);
                const tipoNombre = m.tipo_movimiento_caja?.nombre ?? "";

                return {
                    id: m.id,
                    monto: montoNum,
                    tipoMovimientoCajaId: m.tipo_movimiento_caja_id,
                    tipoMovimientoNombre: tipoNombre,
                    descripcion: m.descripcion || "",
                    cajaId: m.caja_id,
                    usuarioId: m.usuario_id.toString(),
                    createdAt: m.created_at,
                    updatedAt: m.updated_at,
                };
            });

            const sortedMovimientos = processedMovimientos.sort((a, b) => {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

            setMovimientos(sortedMovimientos);
        } catch (err: any) {
            console.error("Error al obtener movimientos:", err);
            setError(err?.message || "Error al obtener movimientos");
            setMovimientos([]);
        } finally {
            setLoading(false);
        }
    }, [cajaId]);

    useEffect(() => {
        fetchMovimientos();
    }, [fetchMovimientos]);

    // Calcular totales
    const ingresos = movimientos
        .filter((m) => m.monto > 0)
        .reduce((sum, m) => sum + m.monto, 0);

    const egresos = Math.abs(
        movimientos
            .filter((m) => m.monto < 0)
            .reduce((sum, m) => sum + m.monto, 0)
    );

    const total = ingresos - egresos;

    // Helper para determinar precio
    const getPrecio = (prodName: string, convenioName: string | null, isPadron: boolean) => {
        const lowerProd = prodName.toLowerCase();
        const lowerConv = convenioName?.toLowerCase() || "";

        if (lowerProd.includes("carpa")) return PRECIO_CARPA;
        if (lowerProd.includes("motorhome") || lowerProd.includes("casilla")) return PRECIO_MOTORHOME;
        if (lowerProd.includes("turno")) return PRECIO_TURNO_FUTBOL;
        if (lowerProd.includes("menor") || lowerProd.includes("pcd")) return 0;

        if (isPadron && convenioName) {
            if (lowerConv.includes("empleado cec")) return PRECIO_CONVENIO_EMPLEADOS;
            return PRECIO_CONVENIO;
        }

        return PRECIO_SIN_CONVENIO;
    };

    // Función para generar ticket de caja cerrada
    const generarTicket = useCallback(async () => {
        if (!caja || !cajaId) {
            console.error("No hay caja seleccionada");
            return;
        }

        setGenerandoTicket(true);

        try {
            // 1. Obtener movimientos de la caja
            const movimientosResponse = await axios.get(`/api/cajas/${cajaId}/movimientos`);
            const movimientosData = movimientosResponse.data;

            // 2. Obtener ventas de la caja
            let ventasData: any[] = [];
            try {
                const ventasResponse = await axios.get(`/api/ventas?caja_id=${cajaId}`);
                ventasData = ventasResponse.data || [];
            } catch (error) {
                console.warn("No se pudo obtener las ventas de la caja:", error);
            }

            // 3. Obtener medios de pago
            let mediosPago: MedioPago[] = [];
            try {
                const mediosResponse = await axios.get<MedioPago[]>("/api/medios-pago");
                mediosPago = mediosResponse.data || [];
            } catch (error) {
                console.warn("No se pudieron obtener los medios de pago:", error);
            }
            const mediosPagoMap = new Map<number, string>(
                mediosPago.map((mp) => [mp.id, mp.nombre])
            );

            // Filtrar movimientos manuales
            const movimientosManuales = movimientosData.filter((mov: any) => {
                const accionType = mov.accion_movimiento_type?.toLowerCase() || "";
                return !accionType.includes("venta") && !accionType.includes("sale");
            });

            // Agrupar movimientos manuales
            const movimientosAgrupados = new Map<string, { tipo: string; subtipo?: string; monto: number }>();

            movimientosManuales.forEach((mov: any) => {
                if (!mov.tipo_movimiento_caja?.nombre?.toLowerCase().includes("manual")) {
                    return;
                }

                const tipoNombre = mov.tipo_movimiento_caja?.nombre || "Movimiento";
                const montoNum = parseFloat(mov.monto);

                if (tipoNombre !== "Ingreso Manual" && tipoNombre !== "Egreso Manual") {
                    return;
                }

                const key = tipoNombre;
                const existing = movimientosAgrupados.get(key);
                if (existing) {
                    existing.monto += Math.abs(montoNum);
                } else {
                    movimientosAgrupados.set(key, {
                        tipo: tipoNombre,
                        monto: Math.abs(montoNum),
                    });
                }
            });

            const movimientosResumen = Array.from(movimientosAgrupados.values());

            // Helper para movimientos manuales
            const esMovimientoManual = (mov: any): boolean => {
                const accionType = mov.accion_movimiento_type;
                const tipoNombre = mov.tipo_movimiento_caja?.nombre?.toLowerCase() || "";
                const esManual = tipoNombre.includes("manual");
                return (accionType === null || accionType === undefined) && esManual;
            };

            // Calcular efectivo id
            const efectivoId = mediosPago.find(
                (mp) => mp.nombre?.toLowerCase().includes("efectivo")
            )?.id ?? null;

            // Calcular ingresos y egresos manuales
            const ingresosEfectivo = movimientosData
                .filter((m: any) => parseFloat(m.monto) > 0 && esMovimientoManual(m))
                .reduce((sum: number, m: any) => sum + parseFloat(m.monto), 0);

            const egresosEfectivo = Math.abs(
                movimientosData
                    .filter((m: any) => parseFloat(m.monto) < 0 && esMovimientoManual(m))
                    .reduce((sum: number, m: any) => sum + parseFloat(m.monto), 0)
            );

            // Ventas en efectivo canceladas
            const ventasEfectivoCanceladas = ventasData
                .filter((v: any) => {
                    const esEfectivo = efectivoId !== null
                        ? v.medio_pago_id === efectivoId
                        : (v.medio_pago?.nombre?.toLowerCase() || "").includes("efectivo");
                    return esEfectivo && v.estado?.nombre === "Cancelada";
                })
                .reduce((sum: number, v: any) => sum + (parseFloat(v.monto_total) || 0), 0);

            // Ventas en efectivo
            const ventasEfectivo = ventasData
                .filter((v: any) => {
                    const esEfectivo = efectivoId !== null
                        ? v.medio_pago_id === efectivoId
                        : (v.medio_pago?.nombre?.toLowerCase() || "").includes("efectivo");
                    return esEfectivo;
                })
                .reduce((sum: number, v: any) => sum + (parseFloat(v.monto_total) || 0), 0);

            // Balance por método de pago
            const balanceMetodosPagoMap = new Map<string, number>();
            ventasData.forEach((venta: any) => {
                if (venta.estado?.nombre === "Cancelada") return;
                const metodoPagoId = venta.medio_pago_id || 0;
                const nombreDesdeApi = mediosPagoMap.get(metodoPagoId);
                const nombreDesdeVenta = venta.medio_pago?.nombre;
                const metodoPago = nombreDesdeApi || nombreDesdeVenta || "Otro";
                const totl = parseFloat(venta.monto_total) || 0;
                const current = balanceMetodosPagoMap.get(metodoPago) || 0;
                balanceMetodosPagoMap.set(metodoPago, current + totl);
            });

            const balanceMetodosPago = Array.from(balanceMetodosPagoMap.entries()).map(
                ([metodoPago, monto]) => ({ metodoPago, monto })
            );

            // Balance efectivo
            const balanceEfectivo = {
                ingresos: ingresosEfectivo,
                egresos: egresosEfectivo,
                ventasEfectivo,
                ventasEfectivoCanceladas: Math.abs(ventasEfectivoCanceladas),
                total: ingresosEfectivo - egresosEfectivo + ventasEfectivo - Math.abs(ventasEfectivoCanceladas),
            };

            // Obtener nombre del usuario de la caja
            const usuarioApertura = caja.usuario?.persona
                ? `${caja.usuario.persona.nombre} ${caja.usuario.persona.apellido}`
                : "Usuario";

            // Obtener reporte por producto/convenio
            let reporteData: any[] = [];
            try {
                const reporteResponse = await axios.get(`/api/ventas/reporte?caja_id=${cajaId}`);
                reporteData = reporteResponse.data || [];
            } catch (error) {
                console.warn("No se pudo obtener el reporte de ventas:", error);
            }

            const conveniosMap = new Map<string, { cantidad: number; monto: number }>();
            const personasPorConvenioMap = new Map<string, number>();

            reporteData.forEach((item: any) => {
                const producto = item.producto;
                const nombreConvenio = item.tipo_convenio;
                const totalPadron = parseInt(item.total_padron) || 0;
                const totalFueraPadron = parseInt(item.total_fuera_padron) || 0;

                if (totalFueraPadron > 0) {
                    const key = `${producto} - Sin Convenio`;
                    const precio = getPrecio(producto, null, false);
                    const current = conveniosMap.get(key) || { cantidad: 0, monto: 0 };
                    conveniosMap.set(key, {
                        cantidad: current.cantidad + totalFueraPadron,
                        monto: current.monto + (totalFueraPadron * precio),
                    });
                    const currentPersonas = personasPorConvenioMap.get(key) || 0;
                    personasPorConvenioMap.set(key, currentPersonas + totalFueraPadron);
                }

                if (totalPadron > 0 && nombreConvenio) {
                    const key = `${producto} - ${nombreConvenio}`;
                    const precio = getPrecio(producto, nombreConvenio, true);
                    const current = conveniosMap.get(key) || { cantidad: 0, monto: 0 };
                    conveniosMap.set(key, {
                        cantidad: current.cantidad + totalPadron,
                        monto: current.monto + (totalPadron * precio),
                    });
                    const currentPersonas = personasPorConvenioMap.get(key) || 0;
                    personasPorConvenioMap.set(key, currentPersonas + totalPadron);
                }
            });

            const resumenConvenios = Array.from(conveniosMap.entries()).map(([convenio, data]) => ({
                convenio,
                cantidad: data.cantidad,
                monto: data.monto,
            }));

            const personasPorConvenio = Array.from(personasPorConvenioMap.entries())
                .map(([convenio, cantidad]) => ({ convenio, cantidad }))
                .sort((a, b) => {
                    if (a.convenio === "Sin Convenio") return 1;
                    if (b.convenio === "Sin Convenio") return -1;
                    return a.convenio.localeCompare(b.convenio);
                });

            // Fecha de cierre (o fecha actual si no hay)
            const fechaCierre = caja.fecha_cierre
                ? new Date(caja.fecha_cierre).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                })
                : new Date().toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                });

            // Generar el ticket
            await generateTicketCierre({
                caja: {
                    id: caja.id,
                    nombre: caja.nombre || "Caja",
                    descripcion: caja.descripcion || "",
                    usuarioApertura,
                },
                movimientos: movimientosResumen,
                balanceEfectivo,
                balanceMetodosPago,
                resumenConvenios,
                personasPorConvenio,
                fechaCierre,
            });

        } catch (error: any) {
            console.error("Error al generar el ticket:", error);
        } finally {
            setGenerandoTicket(false);
        }
    }, [caja, cajaId, getPrecio]);

    return {
        movimientos,
        ingresos,
        egresos,
        total,
        loading,
        error,
        generarTicket,
        generandoTicket,
    };
}
