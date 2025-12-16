/**
 * Servicio para operaciones relacionadas con precios de entrada
 */
import axios from "@/utils/axios";
import { ProductoPreciosResponse } from "../types";

/**
 * Carga el precio de entrada "no afiliado" para un producto
 */
export async function loadPrecioEntradaNoSocio(
  productoId: number
): Promise<number | null> {
  try {
    const response = await axios.get<ProductoPreciosResponse>(
      `/api/productos/${productoId}/precios`
    );

    // Buscar la lista de precios de "no afiliado" (case insensitive)
    const precioNoSocio = response.data.precios.find((precio) =>
      precio.nombre_lista.toLowerCase().includes("no afiliado")
    );

    if (precioNoSocio) {
      return parseFloat(precioNoSocio.precio_unitario);
    } else {
      console.warn(
        "No se encontró precio de 'no afiliado' para el producto de entrada"
      );
      return null;
    }
  } catch (error) {
    console.error("Error al cargar precio de entrada no afiliado:", error);
    return null;
  }
}

/**
 * Carga el precio de entrada socio (mayor o menor) según el convenio
 */
export async function loadPrecioEntradaSocio(
  productoId: number,
  tipo: "mayor" | "menor",
  convenioNombre: string
): Promise<{ precio: number; listaPrecioId: number } | null> {
  try {
    const response = await axios.get<ProductoPreciosResponse>(
      `/api/productos/${productoId}/precios`
    );

    // Determinar qué lista de precios usar según el convenio
    // Si el convenio es "empleado", usar lista_precio_id = 2
    // Para todos los demás, usar lista_precio_id = 1
    const listaPrecioIdBuscada = convenioNombre.toLowerCase().includes("empleado")
      ? 2
      : 1;

    // Buscar el precio con el lista_precio_id correspondiente
    const precioSocio = response.data.precios.find(
      (precio) => precio.lista_precio_id === listaPrecioIdBuscada
    );

    if (precioSocio) {
      return {
        precio: parseFloat(precioSocio.precio_unitario),
        listaPrecioId: listaPrecioIdBuscada,
      };
    } else {
      console.warn(
        `No se encontró precio con lista_precio_id ${listaPrecioIdBuscada} para el producto de entrada ${tipo}`
      );
      return null;
    }
  } catch (error) {
    console.error(`Error al cargar precio de entrada socio ${tipo}:`, error);
    return null;
  }
}

