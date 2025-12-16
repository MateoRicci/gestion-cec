/**
 * Hook para gestionar el detalle de venta (items del carrito)
 */
import { useState, useEffect, useRef } from "react";
import { DetalleItem, ClienteData } from "../types";
import { PreciosEntradaState } from "./usePreciosEntrada";

export function useDetalleVenta(
  clienteData: ClienteData | null,
  familiaresSeleccionados: Set<string>,
  precios: PreciosEntradaState
) {
  const [detalleItems, setDetalleItems] = useState<DetalleItem[]>([]);
  
  // Usar refs para comparar valores anteriores y evitar loops infinitos
  const prevClienteDataRef = useRef<ClienteData | null>(null);
  const prevFamiliaresRef = useRef<Set<string>>(new Set());
  const prevPreciosRef = useRef<PreciosEntradaState | null>(null);

  // Función helper para comparar si los precios cambiaron realmente
  const preciosChanged = (prev: PreciosEntradaState | null, current: PreciosEntradaState): boolean => {
    if (!prev) return true;
    return (
      prev.precioEntradaNoSocio !== current.precioEntradaNoSocio ||
      prev.productoEntradaId !== current.productoEntradaId ||
      prev.precioEntradaMayor !== current.precioEntradaMayor ||
      prev.precioEntradaMenor !== current.precioEntradaMenor ||
      prev.productoEntradaMayorId !== current.productoEntradaMayorId ||
      prev.productoEntradaMenorId !== current.productoEntradaMenorId ||
      prev.listaPrecioIdSocio !== current.listaPrecioIdSocio
    );
  };

  // Función helper para comparar Sets
  const setsEqual = (a: Set<string>, b: Set<string>): boolean => {
    if (a.size !== b.size) return false;
    for (const item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  };

  // Sincronizar checkboxes seleccionados con el detalle de venta
  useEffect(() => {
    // Verificar si realmente cambió algo para evitar loops infinitos
    const clienteChanged = prevClienteDataRef.current !== clienteData;
    const familiaresChanged = !setsEqual(prevFamiliaresRef.current, familiaresSeleccionados);
    const preciosChangedValue = preciosChanged(prevPreciosRef.current, precios);

    if (!clienteChanged && !familiaresChanged && !preciosChangedValue) {
      return; // No hay cambios reales, no hacer nada
    }

    // Actualizar refs
    prevClienteDataRef.current = clienteData;
    prevFamiliaresRef.current = new Set(familiaresSeleccionados);
    prevPreciosRef.current = { ...precios };

    if (!clienteData) {
      // Si no hay cliente, eliminar todas las entradas de socio
      setDetalleItems((prev) =>
        prev.filter((item) => !item.id.startsWith("entrada-socio-"))
      );
      return;
    }
    if (!clienteData) {
      // Si no hay cliente, eliminar todas las entradas de socio
      setDetalleItems((prev) =>
        prev.filter((item) => !item.id.startsWith("entrada-socio-"))
      );
      return;
    }

    // Obtener todas las personas seleccionadas con su categoría de edad
    const personasSeleccionadas: Array<{
      dni: string;
      nombre: string;
      tipo: "titular" | "familiar";
      edad_categoria: "mayor" | "menor";
    }> = [];

    // Agregar titular si está seleccionado
    if (familiaresSeleccionados.has(`titular-${clienteData.titular.dni_titular}`)) {
      personasSeleccionadas.push({
        dni: clienteData.titular.dni_titular,
        nombre: `${clienteData.titular.nombre_titular} ${clienteData.titular.apellido_titular}`,
        tipo: "titular",
        edad_categoria: "mayor", // El titular siempre es mayor
      });
    }

    // Agregar familiares seleccionados
    if (clienteData.familiares) {
      clienteData.familiares.forEach((familiar) => {
        if (
          familiaresSeleccionados.has(`familiar-${familiar.dni_familiar}`)
        ) {
          personasSeleccionadas.push({
            dni: familiar.dni_familiar,
            nombre: `${familiar.nombre_familiar} ${familiar.apellido_familiar}`,
            tipo: "familiar",
            edad_categoria: familiar.edad_categoria,
          });
        }
      });
    }

    // Determinar el precio según el tipo de convenio
    const esConsumidorFinal = clienteData.titular.convenio === "Consumidor Final";

    // Actualizar el detalle: mantener productos normales y actualizar entradas de socio
    setDetalleItems((prev) => {
      // Mantener solo los items que NO son entradas de socio
      const itemsSinEntradasSocio = prev.filter(
        (item) => !item.id.startsWith("entrada-socio-")
      );

      // Crear nuevas entradas de socio para las personas seleccionadas
      const nuevasEntradasSocio: DetalleItem[] = personasSeleccionadas.map(
        (persona) => {
          let productoId: number;
          let precio: number;
          let nombreLista: string;
          let productoNombre: string;
          let afiliadoId: string | null = null;
          let esTitular = false;

          if (esConsumidorFinal) {
            // Para consumidor final, usar el producto de entrada general
            productoId = precios.productoEntradaId || 0;
            precio = precios.precioEntradaNoSocio || 0;
            nombreLista = "Entrada No Afiliado";
            productoNombre = `Entrada No Afiliado ${persona.nombre}`;
            afiliadoId = null;
          } else {
            // Para socios, usar el producto según la edad
            if (persona.edad_categoria === "mayor") {
              productoId = precios.productoEntradaMayorId || 0;
              precio = precios.precioEntradaMayor || 0;
              nombreLista = "Entrada Afiliado Mayor";
              productoNombre = `Entrada Afiliado Mayor ${persona.nombre}`;
            } else {
              productoId = precios.productoEntradaMenorId || 0;
              precio = precios.precioEntradaMenor || 0;
              nombreLista = "Entrada Afiliado Menor";
              productoNombre = `Entrada Afiliado Menor ${persona.nombre}`;
            }

            // Obtener el id_afiliado según el tipo de persona
            if (persona.tipo === "titular") {
              afiliadoId = clienteData.titular.id_titular;
              esTitular = true;
            } else {
              const familiar = clienteData.familiares?.find(
                (f) => f.dni_familiar === persona.dni
              );
              if (familiar) {
                afiliadoId = familiar.id_familiar;
              }
              esTitular = false;
            }
          }

          return {
            id: `entrada-socio-${persona.dni}`,
            productoId,
            productoNombre,
            listaPrecioId: precios.listaPrecioIdSocio,
            nombreLista,
            cantidad: 1,
            precio,
            subtotal: precio,
            afiliadoId,
            esTitular,
            dniPersona: persona.dni,
          };
        }
      );

      return [...itemsSinEntradasSocio, ...nuevasEntradasSocio];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteData, familiaresSeleccionados, precios]);

  const agregarItem = (item: DetalleItem) => {
    setDetalleItems((prev) => [...prev, item]);
  };

  const agregarItems = (items: DetalleItem[]) => {
    setDetalleItems((prev) => [...prev, ...items]);
  };

  const eliminarItem = (itemId: string) => {
    setDetalleItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const limpiarDetalle = () => {
    setDetalleItems([]);
  };

  const calcularTotal = () => {
    return detalleItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  return {
    detalleItems,
    agregarItem,
    agregarItems,
    eliminarItem,
    limpiarDetalle,
    calcularTotal,
  };
}

