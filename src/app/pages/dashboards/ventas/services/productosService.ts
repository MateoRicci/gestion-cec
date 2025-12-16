/**
 * Servicio para operaciones relacionadas con productos
 */
import axios from "@/utils/axios";
import { ProductoResponse, Producto, ProductoPreciosResponse } from "../types";

/**
 * Obtiene los productos disponibles para un punto de venta
 */
export async function getProductos(puntoVentaId: number): Promise<Producto[]> {
  const puntosVentaParam = [puntoVentaId];

  const response = await axios.get<ProductoResponse[]>("/api/productos", {
    params: {
      puntosVenta: puntosVentaParam,
    },
    paramsSerializer: () => {
      const searchParams = new URLSearchParams();
      puntosVentaParam.forEach((id) => {
        searchParams.append("puntosVenta[]", id.toString());
      });
      return searchParams.toString();
    },
  });

  if (!Array.isArray(response.data)) {
    console.error("La respuesta no es un array:", response.data);
    return [];
  }

  // Mapear la respuesta a la estructura esperada
  return response.data.map((prod) => {
    const categoriasFromResponse = prod.categoria || prod.categorias || [];
    const categoriasMapeadas = categoriasFromResponse.map((cat: any) => ({
      id: cat.id,
      nombre: cat.nombre,
    }));

    return {
      id: prod.id,
      nombre: prod.nombre,
      descripcion: prod.descripcion || "",
      codigo_producto:
        typeof prod.codigo_producto === "string"
          ? prod.codigo_producto
          : String(prod.codigo_producto),
      precio: prod.precio,
      controla_stock: prod.controla_stock || false,
      categorias: categoriasMapeadas,
      puntos_venta: prod.puntos_venta || [],
    };
  });
}

/**
 * Obtiene los precios de un producto
 */
export async function getProductoPrecios(
  productoId: number
): Promise<ProductoPreciosResponse> {
  const response = await axios.get<ProductoPreciosResponse>(
    `/api/productos/${productoId}/precios`
  );
  return response.data;
}

/**
 * Busca productos de entrada en una lista de productos
 */
export function findProductosEntrada(productos: Producto[]): {
  productoEntrada: Producto | null;
  productoEntradaMayor: Producto | null;
  productoEntradaMenor: Producto | null;
} {
  const productoEntrada = productos.find(
    (prod) =>
      prod.nombre.toLowerCase().includes("entrada") &&
      !prod.nombre.toLowerCase().includes("mayor") &&
      !prod.nombre.toLowerCase().includes("menor")
  );

  const productoEntradaMayor = productos.find(
    (prod) =>
      prod.nombre.toLowerCase().includes("entrada") &&
      prod.nombre.toLowerCase().includes("mayor")
  );

  const productoEntradaMenor = productos.find(
    (prod) =>
      prod.nombre.toLowerCase().includes("entrada") &&
      prod.nombre.toLowerCase().includes("menor")
  );

  return {
    productoEntrada: productoEntrada || null,
    productoEntradaMayor: productoEntradaMayor || null,
    productoEntradaMenor: productoEntradaMenor || null,
  };
}

