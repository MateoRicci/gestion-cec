/**
 * Servicio para operaciones relacionadas con clientes y afiliados
 */
import axios from "@/utils/axios";
import { AfiliadoResponse, ClienteData } from "../types";

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
  };
}

