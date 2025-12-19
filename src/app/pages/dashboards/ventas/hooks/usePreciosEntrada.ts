/**
 * Hook para gestionar precios de entrada
 */
import { useState, useCallback } from "react";
import {
  loadPrecioEntradaNoSocio,
  loadPrecioEntradaSocio,
} from "../services/preciosEntradaService";
import { ClienteData } from "../types";

const PRODUCTO_ENTRADA_MAYOR_ID = 1;
const PRODUCTO_ENTRADA_MENOR_ID = 2;

export interface PreciosEntradaState {
  precioEntradaNoSocio: number | null;
  productoEntradaId: number | null;
  productoEntradaMayorId: number | 1;
  productoEntradaMenorId: number | 2;
  precioEntradaMayor: number | null;
  precioEntradaMenor: number | null;
  listaPrecioIdSocio: number;
}

export function usePreciosEntrada() {
  const [precios, setPrecios] = useState<PreciosEntradaState>({
    precioEntradaNoSocio: null,
    productoEntradaId: null,
    productoEntradaMayorId: PRODUCTO_ENTRADA_MAYOR_ID,
    productoEntradaMenorId: PRODUCTO_ENTRADA_MENOR_ID,
    precioEntradaMayor: null,
    precioEntradaMenor: null,
    listaPrecioIdSocio: 1,
  });

  const setProductoEntradaId = useCallback((id: number | null) => {
    setPrecios((prev) => ({ ...prev, productoEntradaId: id }));
  }, []);

  const setProductoEntradaMayorId = useCallback((id: number) => {
    // setPrecios((prev) => ({ ...prev, productoEntradaMayorId: id || PRODUCTO_ENTRADA_MAYOR_ID }));
    setPrecios((prev) => ({ ...prev, productoEntradaMayorId: PRODUCTO_ENTRADA_MAYOR_ID }));
  }, []);

  const setProductoEntradaMenorId = useCallback((id: number) => {
    // setPrecios((prev) => ({ ...prev, productoEntradaMenorId: id || PRODUCTO_ENTRADA_MENOR_ID }));
    setPrecios((prev) => ({ ...prev, productoEntradaMenorId: PRODUCTO_ENTRADA_MENOR_ID }));
  }, []);

  const loadPrecioNoSocio = useCallback(async (productoId: number) => {
    const precio = await loadPrecioEntradaNoSocio(productoId);
    setPrecios((prev) => ({ ...prev, precioEntradaNoSocio: precio }));
  }, []);

  const loadPreciosSocio = useCallback(
    async (clienteData: ClienteData | null) => {
      if (!clienteData) {
        setPrecios((prev) => ({
          ...prev,
          precioEntradaMayor: null,
          precioEntradaMenor: null,
          listaPrecioIdSocio: 1,
        }));
        return;
      }

      const convenioNombre = clienteData.titular.convenio || "";

      const promises: Promise<void>[] = [];

      setPrecios((prev) => {
        if (prev.productoEntradaMayorId) {
          promises.push(
            loadPrecioEntradaSocio(
              prev.productoEntradaMayorId,
              "mayor",
              convenioNombre
            ).then((result) => {
              if (result) {
                setPrecios((current) => ({
                  ...current,
                  precioEntradaMayor: result.precio,
                  listaPrecioIdSocio: result.listaPrecioId,
                }));
              }
            })
          );
        }

        if (prev.productoEntradaMenorId) {
          promises.push(
            loadPrecioEntradaSocio(
              prev.productoEntradaMenorId,
              "menor",
              convenioNombre
            ).then((result) => {
              if (result) {
                setPrecios((current) => ({
                  ...current,
                  precioEntradaMenor: result.precio,
                  listaPrecioIdSocio: result.listaPrecioId,
                }));
              }
            })
          );
        }

        return prev;
      });

      await Promise.all(promises);
    },
    []
  );

  const clearPrecios = useCallback(() => {
    setPrecios({
      precioEntradaNoSocio: null,
      productoEntradaId: null,
      productoEntradaMayorId: PRODUCTO_ENTRADA_MAYOR_ID,
      productoEntradaMenorId: PRODUCTO_ENTRADA_MENOR_ID,
      precioEntradaMayor: null,
      precioEntradaMenor: null,
      listaPrecioIdSocio: 1,
    });
  }, []);

  return {
    precios,
    setProductoEntradaId,
    setProductoEntradaMayorId,
    setProductoEntradaMenorId,
    loadPrecioNoSocio,
    loadPreciosSocio,
    clearPrecios,
  };
}

