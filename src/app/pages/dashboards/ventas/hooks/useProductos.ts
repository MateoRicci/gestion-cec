/**
 * Hook para gestionar productos
 */
import { useState, useEffect, useMemo } from "react";
import { Producto } from "../types";
import { getProductos, findProductosEntrada } from "../services/productosService";

export function useProductos(puntoVentaId: number | undefined) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!puntoVentaId) {
      setProductos([]);
      setIsLoading(false);
      return;
    }

    const loadProductos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const productosData = await getProductos(puntoVentaId);
        setProductos(productosData);
      } catch (err: any) {
        console.error("Error al cargar productos:", err);
        setError(err?.message || "Error al cargar productos");
        setProductos([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProductos();
  }, [puntoVentaId]);

  // Memoizar productosEntrada para evitar recrear el objeto en cada render
  const productosEntrada = useMemo(
    () => findProductosEntrada(productos),
    [productos]
  );

  return {
    productos,
    isLoading,
    error,
    productosEntrada,
  };
}

