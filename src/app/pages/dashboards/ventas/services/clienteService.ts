/**
 * Servicio para operaciones relacionadas con clientes y afiliados
 */
import axios from "@/utils/axios";
import { AfiliadoResponse, ClienteData, PreciosConvenio } from "../types";

/**
 * Busca un afiliado por DNI
 */
export async function buscarAfiliadoPorDni(
  dni: string
): Promise<AfiliadoResponse> {
  const dniBuscado = dni.trim();
  const response = await axios.get<AfiliadoResponse>(
    `/api/afiliados/buscar-por-documento/${dniBuscado}`
  );
  return response.data;
}

/**
 * Extrae los precios de entrada del campo lista_precio
 * Busca productos que contengan "Mayores" o "Menores" en el nombre
 */
function extraerPreciosConvenio(
  afiliado: AfiliadoResponse
): PreciosConvenio | undefined {
  if (!afiliado.lista_precio || afiliado.lista_precio.length === 0) {
    return undefined;
  }

  // lista_precio es un array de arrays, tomamos el primer elemento
  const listasPrecio = afiliado.lista_precio[0];
  if (!listasPrecio || listasPrecio.length === 0) {
    return undefined;
  }

  const listaPrecio = listasPrecio[0];
  if (!listaPrecio || !listaPrecio.productos) {
    return undefined;
  }

  let entradaMayor = 0;
  let entradaMenor = 0;

  for (const producto of listaPrecio.productos) {
    const nombreLower = producto.nombre.toLowerCase();
    if (nombreLower.includes("mayores")) {
      entradaMayor = parseFloat(producto.precio_unitario) || 0;
    } else if (nombreLower.includes("menores")) {
      entradaMenor = parseFloat(producto.precio_unitario) || 0;
    }
  }

  return {
    entradaMayor,
    entradaMenor,
    listaPrecioId: listaPrecio.id,
  };
}

/**
 * Convierte la respuesta del backend a ClienteData
 */
export function mapAfiliadoToClienteData(
  afiliado: AfiliadoResponse
): ClienteData {
  return {
    titular: {
      id_titular: afiliado.id_afiliado,
      id_cliente_titular: afiliado.cliente,
      nombre_titular: afiliado.titular.nombre || "",
      apellido_titular: afiliado.titular.apellido || "",
      dni_titular: afiliado.titular.numero_documento?.toString() || "",
      convenio: afiliado.convenio?.nombre || "",
      tipo_convenio_id: afiliado.convenio?.id || null,
      compro_hoy: afiliado.compro_hoy || false,
    },
    familiares: afiliado.familiares?.map((familiar) => ({
      id_familiar: familiar.id_afiliado,
      id_cliente_familiar: "", // No viene en la respuesta, pero mantenemos la estructura
      nombre_familiar: familiar.persona.nombre,
      apellido_familiar: familiar.persona.apellido,
      dni_familiar: familiar.persona.numero_documento.toString(),
      relacion: familiar.parentesco,
      edad_categoria:
        familiar.persona.edad_categoria === "menor" ? "menor" : "mayor",
      compro_hoy: familiar.compro_hoy || false,
    })),
    preciosConvenio: extraerPreciosConvenio(afiliado),
  };
}

