/**
 * Hook para gestionar precios de entrada
 */
import { useState, useCallback } from "react";
import {
  loadPrecioEntradaNoSocio,
  loadPrecioEntradaSocio,
} from "../services/preciosEntradaService";
import { ClienteData } from "../types";

export interface PreciosEntradaState {
  precioEntradaNoSocio: number | null;
  productoEntradaId: number | null;
  productoEntradaMayorId: number | null;
  productoEntradaMenorId: number | null;
  precioEntradaMayor: number | null;
  precioEntradaMenor: number | null;
  listaPrecioIdSocio: number;
}

export function usePreciosEntrada() {
  const [precios, setPrecios] = useState<PreciosEntradaState>({
    precioEntradaNoSocio: null,
    productoEntradaId: null,
    productoEntradaMayorId: null,
    productoEntradaMenorId: null,
    precioEntradaMayor: null,
    precioEntradaMenor: null,
    listaPrecioIdSocio: 1,
  });

  const setProductoEntradaId = useCallback((id: number | null) => {
    setPrecios((prev) => ({ ...prev, productoEntradaId: id }));
  }, []);

  const setProductoEntradaMayorId = useCallback((id: number | null) => {
    setPrecios((prev) => ({ ...prev, productoEntradaMayorId: id }));
  }, []);

  const setProductoEntradaMenorId = useCallback((id: number | null) => {
    setPrecios((prev) => ({ ...prev, productoEntradaMenorId: id }));
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
      productoEntradaMayorId: null,
      productoEntradaMenorId: null,
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

