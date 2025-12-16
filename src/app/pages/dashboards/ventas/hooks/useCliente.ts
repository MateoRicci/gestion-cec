/**
 * Hook para gestionar la búsqueda y selección de clientes
 */
import { useState, useCallback } from "react";
import {
  ClienteData,
} from "../types";
import {
  buscarAfiliadoPorDni,
  mapAfiliadoToClienteData,
} from "../services/clienteService";

export function useCliente() {
  const [dni, setDni] = useState("");
  const [clienteData, setClienteData] = useState<ClienteData | null>(null);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConsumidorFinal, setIsConsumidorFinal] = useState(false);
  const [familiaresSeleccionados, setFamiliaresSeleccionados] = useState<
    Set<string>
  >(new Set());

  const loadClienteByDni = useCallback(async (dniValue: string) => {
    if (!dniValue || dniValue.length < 3) {
      setClienteData(null);
      setClienteId(null);
      setIsConsumidorFinal(false);
      setFamiliaresSeleccionados(new Set());
      return;
    }

    setIsLoading(true);
    try {
      const dniBuscado = dniValue.trim();
      const afiliado = await buscarAfiliadoPorDni(dniBuscado);

      // Si es Consumidor Final (id_afiliado === "CF")
      if (afiliado.id_afiliado === "CF") {
        setClienteData(null);
        setClienteId(afiliado.cliente);
        setIsConsumidorFinal(true);
        setFamiliaresSeleccionados(new Set());
        return;
      }

      // Si no es CF, procesar como afiliado normal
      setIsConsumidorFinal(false);
      setClienteId(afiliado.cliente);

      const clienteDataMapped = mapAfiliadoToClienteData(afiliado);
      setClienteData(clienteDataMapped);

      // Marcar el DNI buscado por defecto
      const seleccionados = new Set<string>();
      if (dniBuscado === clienteDataMapped.titular.dni_titular) {
        seleccionados.add(`titular-${clienteDataMapped.titular.dni_titular}`);
      }

      if (clienteDataMapped.familiares) {
        clienteDataMapped.familiares.forEach((familiar) => {
          if (dniBuscado === familiar.dni_familiar) {
            seleccionados.add(`familiar-${familiar.dni_familiar}`);
          }
        });
      }

      // Si no se encontró el DNI buscado, marcar el titular por defecto
      if (seleccionados.size === 0) {
        seleccionados.add(`titular-${clienteDataMapped.titular.dni_titular}`);
      }

      setFamiliaresSeleccionados(seleccionados);
    } catch (error: any) {
      console.error("Error al cargar datos del cliente:", error);
      setClienteData(null);
      setClienteId(null);
      setIsConsumidorFinal(false);
      setFamiliaresSeleccionados(new Set());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleFamiliar = useCallback(
    (key: string) => {
      setFamiliaresSeleccionados((prev) => {
        const newSeleccionados = new Set(prev);
        if (newSeleccionados.has(key)) {
          newSeleccionados.delete(key);
        } else {
          newSeleccionados.add(key);
        }
        return newSeleccionados;
      });
    },
    []
  );

  const clearCliente = useCallback(() => {
    setDni("");
    setClienteData(null);
    setClienteId(null);
    setIsConsumidorFinal(false);
    setFamiliaresSeleccionados(new Set());
  }, []);

  return {
    dni,
    setDni,
    clienteData,
    clienteId,
    isLoading,
    isConsumidorFinal,
    familiaresSeleccionados,
    setFamiliaresSeleccionados,
    loadClienteByDni,
    toggleFamiliar,
    clearCliente,
  };
}

