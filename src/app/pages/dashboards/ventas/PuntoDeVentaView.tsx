import { useState, useEffect, useRef } from "react";
import { Button, Input, Checkbox } from "@/components/ui";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useVentasContext } from "@/app/contexts/ventas/context";
import { useAuthContext } from "@/app/contexts/auth/context";
import { useCajaActions } from "./hooks/useCajaActions";
import { useMovimientos } from "./hooks/useMovimientos";
import { invalidateMovimientosCaja } from "./hooks/useMovimientosCaja";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { MovimientoModal } from "./components/MovimientoModal";
import { ProductoPreciosModal } from "./components/ProductoPreciosModal";
import { CajaEstado } from "./components/CajaEstado";
import { CajaControls } from "./components/CajaControls";
import axios from "@/utils/axios";
import {
  TbMountain,
} from "react-icons/tb";
import { Spinner } from "@/components/ui/Spinner";
import { generateRecibo } from "@/utils/generateRecibo";

// ----------------------------------------------------------------------

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  codigo_producto: string;
  precio?: number;
  controla_stock?: boolean;
  categorias?: Array<{ id: number; nombre: string }>;
  puntos_venta?: Array<{ id: number; nombre: string }>;
}

interface ProductoResponse {
  id: number;
  nombre: string;
  descripcion: string;
  codigo_producto: string;
  precio?: number;
  controla_stock?: boolean;
  categoria?: Array<{ id: number; nombre: string; descripcion?: string; categoriaPadreId?: number | null; createdAt?: string; updatedAt?: string; deletedAt?: string | null }>;
  categorias?: Array<{ id: number; nombre: string }>;
  puntos_venta?: Array<{ id: number; nombre: string }>;
}

interface Familiar {
  id_familiar: string; // id_afiliado del familiar
  id_cliente_familiar: string; // cliente UUID del familiar
  nombre_familiar: string;
  apellido_familiar: string;
  dni_familiar: string;
  relacion: string;
  edad_categoria: "mayor" | "menor";
  compro_hoy?: boolean; // Indica si ya compró/ingresó hoy
}

interface Titular {
  id_titular: string; // id_afiliado del titular
  id_cliente_titular: string; // cliente UUID del titular
  nombre_titular: string;
  apellido_titular: string;
  dni_titular: string;
  convenio: string;
  compro_hoy?: boolean; // Indica si ya compró/ingresó hoy
}

interface ClienteData {
  titular: Titular;
  familiares?: Familiar[];
}

// Interfaces para la respuesta del backend
interface AfiliadoResponse {
  id_afiliado: string;
  numero_afiliado: string;
  activo: boolean;
  fecha_alta: string;
  fecha_baja: string | null;
  fecha_ultimo_aporte: string | null;
  cliente: string;
  compro_hoy?: boolean; // Indica si el titular ya compró/ingresó hoy
  convenio: {
    id: number;
    nombre: string;
  };
  titular: {
    nombre: string;
    apellido: string;
    numero_documento: number;
  };
  familiares: Array<{
    id_afiliado: string;
    tipo_familiar_id: number;
    vencimiento_cargo: string | null;
    compro_hoy?: boolean; // Indica si el familiar ya compró/ingresó hoy
    persona: {
      nombre: string;
      apellido: string;
      numero_documento: number;
      edad_categoria: string;
    };
    parentesco: string;
  }>;
}

interface DetalleItem {
  id: string; // ID único para el item
  productoId: number;
  productoNombre: string;
  listaPrecioId: number;
  nombreLista: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  // Campos adicionales para entradas de socio
  afiliadoId?: string | null; // id_afiliado si es entrada de socio, null si es extra
  esTitular?: boolean; // true solo si es el titular
  dniPersona?: string; // DNI de la persona para identificar entradas de socio
}

interface MedioPago {
  id: number;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ----------------------------------------------------------------------

export function PuntoDeVentaView() {
  const {
    puntosDeVenta,
    selectedPuntoDeVentaId,
    setSelectedPuntoDeVentaId,
    cajaAbierta,
    isLoadingCaja,
    getCajaId,
    refreshCajaEstado,
  } = useVentasContext();
  const { user } = useAuthContext();
  const [showPvDropdown, setShowPvDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estados para productos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoadingProductos, setIsLoadingProductos] = useState(true);
  
  // Estado para el modal de precios
  const [showPreciosModal, setShowPreciosModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  
  // Estado para el detalle de venta
  const [detalleItems, setDetalleItems] = useState<DetalleItem[]>([]);

  // Estado del formulario de cliente
  const [dni, setDni] = useState("");
  const [clienteData, setClienteData] = useState<ClienteData | null>(null);
  const [clienteId, setClienteId] = useState<string | null>(null); // UUID del cliente del titular
  const [isLoadingCliente, setIsLoadingCliente] = useState(false);
  const [isConsumidorFinal, setIsConsumidorFinal] = useState(false);
  const [familiaresSeleccionados, setFamiliaresSeleccionados] = useState<Set<string>>(new Set());
  
  // Estado para precio de entrada "no socio"
  const [precioEntradaNoSocio, setPrecioEntradaNoSocio] = useState<number | null>(null);
  const [productoEntradaId, setProductoEntradaId] = useState<number | null>(null);
  
  // Estado para productos y precios de entrada mayor y menor
  const [productoEntradaMayorId, setProductoEntradaMayorId] = useState<number | null>(null);
  const [productoEntradaMenorId, setProductoEntradaMenorId] = useState<number | null>(null);
  const [precioEntradaMayor, setPrecioEntradaMayor] = useState<number | null>(null);
  const [precioEntradaMenor, setPrecioEntradaMenor] = useState<number | null>(null);
  const [listaPrecioIdSocio, setListaPrecioIdSocio] = useState<number>(1); // Por defecto id 1, cambia a 2 si es empleado
  
  // Estado para métodos de pago
  const [mediosPago, setMediosPago] = useState<MedioPago[]>([]);
  const [isLoadingMediosPago, setIsLoadingMediosPago] = useState(true);
  const [metodoPagoId, setMetodoPagoId] = useState<number | null>(null);
  
  // Estados para modales de venta
  const [showVentaExitoModal, setShowVentaExitoModal] = useState(false);
  const [showVentaErrorModal, setShowVentaErrorModal] = useState(false);
  const [ventaErrorMessage, setVentaErrorMessage] = useState("");
  const [isProcesandoVenta, setIsProcesandoVenta] = useState(false);

  const currentPv =
    puntosDeVenta.find((pv) => pv.id.toString() === selectedPuntoDeVentaId) ||
    puntosDeVenta[0];
  const cajaId = currentPv ? getCajaId(currentPv.id.toString()) : null;

  // Acciones de caja y movimientos
  const {
    showConfirmModal,
    confirmLoading,
    confirmState,
    solicitarAbrirCaja,
    solicitarCerrarCaja,
    confirmarAccion,
    getConfirmMessages,
    closeConfirmModal,
  } = useCajaActions(currentPv);

  const {
    showMovimientoModal,
    movimientoTipo,
    monto,
    descripcion,
    loading: movimientoLoading,
    abrirModalMovimiento,
    cerrarModalMovimiento,
    setMonto,
    setDescripcion,
    confirmarMovimiento,
  } = useMovimientos();

  // Función para cargar el precio de entrada "no socio"
  const loadPrecioEntradaNoSocio = async (productoId: number) => {
    try {
      const response = await axios.get<{ precios: Array<{ lista_precio_id: number; nombre_lista: string; precio_unitario: string }> }>(
        `/api/productos/${productoId}/precios`
      );
      
      // Buscar la lista de precios de "no socio" (case insensitive)
      const precioNoSocio = response.data.precios.find((precio) =>
        precio.nombre_lista.toLowerCase().includes("no socio")
      );

      if (precioNoSocio) {
        setPrecioEntradaNoSocio(parseFloat(precioNoSocio.precio_unitario));
      } else {
        console.warn("No se encontró precio de 'no socio' para el producto de entrada");
        setPrecioEntradaNoSocio(null);
      }
    } catch (error) {
      console.error("Error al cargar precio de entrada no socio:", error);
      setPrecioEntradaNoSocio(null);
    }
  };

  // Función para cargar el precio de entrada socio (mayor o menor) según el convenio
  const loadPrecioEntradaSocio = async (productoId: number, tipo: "mayor" | "menor", convenioNombre: string) => {
    try {
      const response = await axios.get<{ precios: Array<{ lista_precio_id: number; nombre_lista: string; precio_unitario: string }> }>(
        `/api/productos/${productoId}/precios`
      );
      
      // Determinar qué lista de precios usar según el convenio
      // Si el convenio es "empleado", usar lista_precio_id = 2
      // Para todos los demás, usar lista_precio_id = 1
      const listaPrecioIdBuscada = convenioNombre.toLowerCase().includes("empleado") ? 2 : 1;
      
      // Buscar el precio con el lista_precio_id correspondiente
      const precioSocio = response.data.precios.find((precio) =>
        precio.lista_precio_id === listaPrecioIdBuscada
      );

      if (precioSocio) {
        if (tipo === "mayor") {
          setPrecioEntradaMayor(parseFloat(precioSocio.precio_unitario));
        } else {
          setPrecioEntradaMenor(parseFloat(precioSocio.precio_unitario));
        }
        // Guardar el lista_precio_id usado
        setListaPrecioIdSocio(listaPrecioIdBuscada);
      } else {
        console.warn(`No se encontró precio con lista_precio_id ${listaPrecioIdBuscada} para el producto de entrada ${tipo}`);
        if (tipo === "mayor") {
          setPrecioEntradaMayor(null);
        } else {
          setPrecioEntradaMenor(null);
        }
      }
    } catch (error) {
      console.error(`Error al cargar precio de entrada socio ${tipo}:`, error);
      if (tipo === "mayor") {
        setPrecioEntradaMayor(null);
      } else {
        setPrecioEntradaMenor(null);
      }
    }
  };

  // Cargar productos
  useEffect(() => {
    const loadProductos = async () => {
      if (!currentPv) return;
      
      setIsLoadingProductos(true);
      try {
        // El endpoint requiere un array con el tipo de venta (punto de venta ID)
        // Siempre será de largo 1 pero debe ser un array
        const puntosVentaParam = [currentPv.id];
        
        // Usar paramsSerializer para asegurar formato puntosVenta[]=id
        const response = await axios.get<ProductoResponse[]>("/api/productos", {
          params: {
            puntosVenta: puntosVentaParam,
          },
          paramsSerializer: () => {
            // Serializar manualmente para asegurar formato puntosVenta[]=id
            const searchParams = new URLSearchParams();
            puntosVentaParam.forEach((id) => {
              searchParams.append('puntosVenta[]', id.toString());
            });
            return searchParams.toString();
          },
        });
        
        console.log("Productos recibidos:", response.data);
        
        if (!Array.isArray(response.data)) {
          console.error("La respuesta no es un array:", response.data);
          setProductos([]);
          return;
        }
        
        const productosMapeados: Producto[] = response.data.map((prod) => {
          // Manejar tanto 'categoria' (singular) como 'categorias' (plural) de la respuesta
          const categoriasFromResponse = prod.categoria || prod.categorias || [];
          // Extraer solo id y nombre para las categorías
          const categoriasMapeadas = categoriasFromResponse.map((cat: any) => ({
            id: cat.id,
            nombre: cat.nombre,
          }));
          
          return {
            id: prod.id,
            nombre: prod.nombre,
            descripcion: prod.descripcion || "",
            codigo_producto: typeof prod.codigo_producto === 'string' ? prod.codigo_producto : String(prod.codigo_producto),
            precio: prod.precio,
            controla_stock: prod.controla_stock || false,
            categorias: categoriasMapeadas,
            puntos_venta: prod.puntos_venta || [],
          };
        });
        
        console.log("Productos mapeados:", productosMapeados);
        setProductos(productosMapeados);
        
        // Buscar productos de entrada
        const productoEntrada = productosMapeados.find(
          (prod) => prod.nombre.toLowerCase().includes("entrada") && 
                    !prod.nombre.toLowerCase().includes("mayor") && 
                    !prod.nombre.toLowerCase().includes("menor")
        );
        
        const productoEntradaMayor = productosMapeados.find(
          (prod) => prod.nombre.toLowerCase().includes("entrada") && 
                    prod.nombre.toLowerCase().includes("mayor")
        );
        
        const productoEntradaMenor = productosMapeados.find(
          (prod) => prod.nombre.toLowerCase().includes("entrada") && 
                    prod.nombre.toLowerCase().includes("menor")
        );
        
        if (productoEntrada) {
          setProductoEntradaId(productoEntrada.id);
          // Cargar precios del producto entrada (para no socio)
          loadPrecioEntradaNoSocio(productoEntrada.id);
        }
        
        if (productoEntradaMayor) {
          setProductoEntradaMayorId(productoEntradaMayor.id);
        }
        
        if (productoEntradaMenor) {
          setProductoEntradaMenorId(productoEntradaMenor.id);
        }
      } catch (error: any) {
        console.error("Error al cargar productos:", error);
        console.error("Detalles del error:", {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          url: error?.config?.url,
        });
        setProductos([]);
      } finally {
        setIsLoadingProductos(false);
      }
    };

    loadProductos();
  }, [currentPv]);

  // Cargar medios de pago
  useEffect(() => {
    const loadMediosPago = async () => {
      setIsLoadingMediosPago(true);
      try {
        const response = await axios.get<MedioPago[]>("/api/medios-pago");
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setMediosPago(response.data);
          // Seleccionar el primer medio de pago por defecto
          setMetodoPagoId(response.data[0].id);
        }
      } catch (error) {
        console.error("Error al cargar medios de pago:", error);
        setMediosPago([]);
      } finally {
        setIsLoadingMediosPago(false);
      }
    };

    loadMediosPago();
  }, []);

  const handleConfirmarMovimiento = async () => {
    if (!cajaId) {
      console.error("No hay caja abierta");
      return;
    }

    try {
      await confirmarMovimiento(cajaId, () => {
        // Invalidar y refrescar todos los componentes que usan movimientos de caja
        invalidateMovimientosCaja(cajaId);
      });
    } catch (error) {
      console.error("Error al confirmar movimiento:", error);
    }
  };

  // Función para cargar datos del cliente por DNI
  const loadClienteByDni = async (dniValue: string) => {
    if (!dniValue || dniValue.length < 3) {
      setClienteData(null);
      setClienteId(null);
      setIsConsumidorFinal(false);
      setFamiliaresSeleccionados(new Set());
      // Limpiar precios de socio cuando se limpia la búsqueda
      setPrecioEntradaMayor(null);
      setPrecioEntradaMenor(null);
      setListaPrecioIdSocio(1);
      return;
    }

    setIsLoadingCliente(true);
    try {
      const dniBuscado = dniValue.trim();
      const response = await axios.get<AfiliadoResponse>(
        `/api/afiliados/buscar-por-documento/${dniBuscado}`
      );

      const afiliado = response.data;

      // Si es Consumidor Final (id_afiliado === "CF")
      if (afiliado.id_afiliado === "CF") {
        setClienteData(null);
        setClienteId(afiliado.cliente); // Guardar el cliente UUID
        setIsConsumidorFinal(true);
        setFamiliaresSeleccionados(new Set());
        // No cargar precios de socio para consumidor final (se cargan manualmente como no socio)
        setPrecioEntradaMayor(null);
        setPrecioEntradaMenor(null);
        setListaPrecioIdSocio(1);
        return;
      }

      // Si no es CF, procesar como afiliado normal
      setIsConsumidorFinal(false);
      setClienteId(afiliado.cliente); // Guardar el cliente UUID del titular

      // Mapear la respuesta del backend a la estructura esperada
      const clienteData: ClienteData = {
        titular: {
          id_titular: afiliado.id_afiliado,
          id_cliente_titular: afiliado.cliente,
          nombre_titular: afiliado.titular.nombre || "",
          apellido_titular: afiliado.titular.apellido || "",
          dni_titular: afiliado.titular.numero_documento?.toString() || "",
          convenio: afiliado.convenio?.nombre || "",
          compro_hoy: afiliado.compro_hoy || false,
        },
        familiares: afiliado.familiares?.map((familiar) => ({
          id_familiar: familiar.id_afiliado,
          id_cliente_familiar: "", // No viene en la respuesta, pero mantenemos la estructura
          nombre_familiar: familiar.persona.nombre,
          apellido_familiar: familiar.persona.apellido,
          dni_familiar: familiar.persona.numero_documento.toString(),
          relacion: familiar.parentesco,
          edad_categoria: familiar.persona.edad_categoria === "menor" ? "menor" : "mayor",
          compro_hoy: familiar.compro_hoy || false,
        })),
      };

      setClienteData(clienteData);

      // Cargar precios de entrada según el convenio
      const convenioNombre = clienteData.titular.convenio || "";
      if (productoEntradaMayorId) {
        loadPrecioEntradaSocio(productoEntradaMayorId, "mayor", convenioNombre);
      }
      if (productoEntradaMenorId) {
        loadPrecioEntradaSocio(productoEntradaMenorId, "menor", convenioNombre);
      }

      // Marcar el DNI buscado por defecto (solo si no compró hoy)
      const seleccionados = new Set<string>();
      // Si es el titular, marcarlo solo si no compró hoy
      // if (dniBuscado === clienteData.titular.dni_titular && !clienteData.titular.compro_hoy) {
      //   seleccionados.add(`titular-${clienteData.titular.dni_titular}`);
      // }

      if (dniBuscado === clienteData.titular.dni_titular) {
        seleccionados.add(`titular-${clienteData.titular.dni_titular}`);
      }
      // Si es un familiar, marcarlo solo si no compró hoy
      if (clienteData.familiares) {
        clienteData.familiares.forEach((familiar) => {
          // if (dniBuscado === familiar.dni_familiar && !familiar.compro_hoy) {
          //   seleccionados.add(`familiar-${familiar.dni_familiar}`);
          // }

          if (dniBuscado === familiar.dni_familiar) {
            seleccionados.add(`familiar-${familiar.dni_familiar}`);
          }
        });
      }
      // Si no se encontró el DNI buscado en titular ni familiares, marcar el titular por defecto (solo si no compró hoy)
      if (seleccionados.size === 0) {
        seleccionados.add(`titular-${clienteData.titular.dni_titular}`);
      }
      setFamiliaresSeleccionados(seleccionados);
    } catch (error: any) {
      console.error("Error al cargar datos del cliente:", error);
      // Si no se encuentra el afiliado, limpiar los datos
      setClienteData(null);
      setClienteId(null);
      setIsConsumidorFinal(false);
      setFamiliaresSeleccionados(new Set());
      // Limpiar precios de socio cuando hay error
      setPrecioEntradaMayor(null);
      setPrecioEntradaMenor(null);
      setListaPrecioIdSocio(1);
    } finally {
      setIsLoadingCliente(false);
    }
  };


  // Sincronizar checkboxes seleccionados con el detalle de venta
  useEffect(() => {
    if (!clienteData) {
      // Si no hay cliente, eliminar todas las entradas de socio
      setDetalleItems((prev) => prev.filter((item) => !item.id.startsWith("entrada-socio-")));
      return;
    }

    // Obtener todas las personas seleccionadas con su categoría de edad
    const personasSeleccionadas: Array<{ 
      dni: string; 
      nombre: string; 
      tipo: "titular" | "familiar";
      edad_categoria: "mayor" | "menor";
    }> = [];

    // Agregar titular si está seleccionado (siempre es mayor) y no compró hoy
    // if (familiaresSeleccionados.has(`titular-${clienteData.titular.dni_titular}`) && !clienteData.titular.compro_hoy) {
      if (familiaresSeleccionados.has(`titular-${clienteData.titular.dni_titular}`)) {      
      personasSeleccionadas.push({
        dni: clienteData.titular.dni_titular,
        nombre: `${clienteData.titular.nombre_titular} ${clienteData.titular.apellido_titular}`,
        tipo: "titular",
        edad_categoria: "mayor", // El titular siempre es mayor
      });
    }

    // Agregar familiares seleccionados con su categoría de edad (solo si no compraron hoy)
    if (clienteData.familiares) {
      clienteData.familiares.forEach((familiar) => {
        // if (familiaresSeleccionados.has(`familiar-${familiar.dni_familiar}`) && !familiar.compro_hoy) {
        if (familiaresSeleccionados.has(`familiar-${familiar.dni_familiar}`)) {
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
      const itemsSinEntradasSocio = prev.filter((item) => !item.id.startsWith("entrada-socio-"));

      // Crear nuevas entradas de socio para las personas seleccionadas
      const nuevasEntradasSocio: DetalleItem[] = personasSeleccionadas.map((persona) => {
        let productoId: number;
        let precio: number;
        let nombreLista: string;
        let productoNombre: string;
        let afiliadoId: string | null = null;
        let esTitular = false;

        if (esConsumidorFinal) {
          // Para consumidor final, usar el producto de entrada general
          productoId = productoEntradaId || 0;
          precio = precioEntradaNoSocio || 0;
          nombreLista = "Entrada No Afiliado";
          productoNombre = `Entrada No Afiliado ${persona.nombre}`;
          // Consumidor final: afiliado_id = null
          afiliadoId = null;
        } else {
          // Para socios, usar el producto según la edad
          if (persona.edad_categoria === "mayor") {
            productoId = productoEntradaMayorId || 0;
            precio = precioEntradaMayor || 0;
            nombreLista = "Entrada Afiliado Mayor";
            productoNombre = `Entrada Afiliado Mayor ${persona.nombre}`;
          } else {
            productoId = productoEntradaMenorId || 0;
            precio = precioEntradaMenor || 0;
            nombreLista = "Entrada Afiliado Menor";
            productoNombre = `Entrada Afiliado Menor ${persona.nombre}`;
          }
          
          // Obtener el id_afiliado según el tipo de persona
          if (persona.tipo === "titular") {
            afiliadoId = clienteData.titular.id_titular;
            esTitular = true;
          } else {
            // Buscar el familiar por DNI para obtener su id_afiliado
            const familiar = clienteData.familiares?.find((f) => f.dni_familiar === persona.dni);
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
          listaPrecioId: listaPrecioIdSocio, // Usar el lista_precio_id según el convenio (1 o 2)
          nombreLista,
          cantidad: 1,
          precio,
          subtotal: precio,
          afiliadoId,
          esTitular,
          dniPersona: persona.dni,
        };
      });

      return [...itemsSinEntradasSocio, ...nuevasEntradasSocio];
    });
  }, [familiaresSeleccionados, clienteData, precioEntradaNoSocio, productoEntradaId, precioEntradaMayor, precioEntradaMenor, productoEntradaMayorId, productoEntradaMenorId, listaPrecioIdSocio]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowPvDropdown(false);
      }
    };

    if (showPvDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPvDropdown]);

  // Función para manejar el click en "Cobrar"
  const handleCobrar = async () => {
    if (!currentPv || !clienteId || detalleItems.length === 0 || !metodoPagoId) {
      return;
    }

    setIsProcesandoVenta(true);
    
    try {
      // Separar items en entradas de socio y entradas extra
      // Si es consumidor final, todas las entradas se tratan como extra (afiliado_id = null)
      const entradasSocio = isConsumidorFinal 
        ? [] 
        : detalleItems.filter((item) => item.id.startsWith("entrada-socio-") && item.afiliadoId !== null);
      const entradasExtra = detalleItems.filter((item) => 
        !item.id.startsWith("entrada-socio-") || isConsumidorFinal || item.afiliadoId === null
      );

      // Construir detalles para entradas de socio (una por persona)
      const detallesSocio = entradasSocio.map((item) => ({
        producto_id: item.productoId,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        precio_total: item.subtotal,
        lista_precio_id: item.listaPrecioId || 0,
        afiliado_id: item.afiliadoId || null,
        es_titular: item.esTitular || false,
      }));

      // Construir detalles para entradas extra (agrupar por producto)
      const detallesExtraMap = new Map<number, {
        producto_id: number;
        cantidad: number;
        precio_unitario: number;
        precio_total: number;
        lista_precio_id: number;
      }>();

      entradasExtra.forEach((item) => {
        const existing = detallesExtraMap.get(item.productoId);
        if (existing) {
          // Agrupar por producto: sumar cantidad y precio_total
          existing.cantidad += item.cantidad;
          existing.precio_total += item.subtotal;
        } else {
          detallesExtraMap.set(item.productoId, {
            producto_id: item.productoId,
            cantidad: item.cantidad,
            precio_unitario: item.precio,
            precio_total: item.subtotal,
            lista_precio_id: item.listaPrecioId || 0,
          });
        }
      });

      const detallesExtra = Array.from(detallesExtraMap.values()).map((detalle) => ({
        ...detalle,
        afiliado_id: null,
        es_titular: false,
      }));

      // Combinar todos los detalles
      const detalles = [...detallesSocio, ...detallesExtra];

      // Construir el payload para la venta
      const ventaPayload = {
        cliente_id: clienteId,
        punto_venta_id: currentPv.id,
        medio_pago_id: metodoPagoId,
        detalles,
      };

      // Log del payload antes de enviar
      console.log("Payload de venta a enviar:", JSON.stringify(ventaPayload, null, 2));

      // Enviar la venta al backend
      const response = await axios.post("/api/ventas", ventaPayload);
      
      // Log de la respuesta
      console.log("Respuesta del servidor:", response.data);

      // Usar el ID de la venta devuelto por el backend
      const ventaId = response.data?.id || response.data?.venta?.id || response.data?.data?.id;
      const numeroRecibo = ventaId ? ventaId.toString() : "000";

      // Obtener el nombre del método de pago seleccionado
      const medioPagoSeleccionado = mediosPago.find((mp) => mp.id === metodoPagoId);
      const metodoPagoNombre = medioPagoSeleccionado?.nombre || "Efectivo";

      // Generar el recibo PDF
      await generateRecibo({
        cliente: clienteData || { titular: { id_titular: "", id_cliente_titular: clienteId, nombre_titular: "", apellido_titular: "", dni_titular: dni, convenio: "No Afiliado" } },
        detalleItems,
        puntoDeVenta: currentPv,
        metodoPago: metodoPagoNombre,
        numeroRecibo,
      });

      // Recargar el estado de la caja para ver el impacto
      await refreshCajaEstado();

      // Mostrar modal de éxito
      setShowVentaExitoModal(true);
    } catch (error: any) {
      console.error("Error al procesar la venta:", error);
      // Mostrar modal de error (no generar PDF ni limpiar datos)
      setVentaErrorMessage(
        error?.response?.data?.message || 
        error?.message || 
        "Error al procesar la venta. Por favor, intenta nuevamente."
      );
      setShowVentaErrorModal(true);
    } finally {
      setIsProcesandoVenta(false);
    }
  };

  // Función para cerrar modal de éxito y limpiar datos
  const handleCerrarModalExito = () => {
    setShowVentaExitoModal(false);
    // Limpiar el formulario después de cobrar exitosamente
    setDni("");
    setClienteData(null);
    setClienteId(null);
    setIsConsumidorFinal(false);
    setFamiliaresSeleccionados(new Set());
    setDetalleItems([]);
  };

  // Función para cerrar modal de error
  const handleCerrarModalError = () => {
    setShowVentaErrorModal(false);
    setVentaErrorMessage("");
  };

  return (
    <section className="flex-1 pt-2">
      {/* Controles de Caja */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-dark-600 dark:bg-dark-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Caja
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-200">
              Abre o cierra la caja para habilitar las ventas.
            </p>
          </div>

          {/* Selector de Punto de Venta */}
          <div className="relative" ref={dropdownRef}>
            <Button
              color="neutral"
              variant="flat"
              className="flex items-center gap-2 px-3 py-1.5 text-sm"
              onClick={() => setShowPvDropdown((prev) => !prev)}
            >
              <span className="text-gray-400">Punto de venta:</span>
              <span className="font-medium">{currentPv?.nombre}</span>
              <ChevronDownIcon className="size-4 text-gray-400" />
            </Button>

            {showPvDropdown && (
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-gray-200 bg-gray-900/95 p-1 text-sm shadow-lg backdrop-blur dark:border-dark-500 dark:bg-dark-700">
                {puntosDeVenta.map((pv) => (
                  <button
                    key={pv.id}
                    type="button"
                    className="flex w-full items-center rounded px-2 py-1.5 text-left text-gray-100 hover:bg-gray-800 dark:hover:bg-dark-600"
                    onClick={() => {
                      setSelectedPuntoDeVentaId(pv.id.toString());
                      setShowPvDropdown(false);
                    }}
                  >
                    {pv.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {isLoadingCaja ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 dark:text-dark-200">
            <div className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Cargando estado de la caja...</span>
          </div>
        ) : (
          <>
            <CajaEstado cajaAbierta={cajaAbierta} cajaId={cajaId} />

            <CajaControls
              cajaAbierta={cajaAbierta}
              currentPv={currentPv}
              user={user}
              onAbrirCaja={solicitarAbrirCaja}
              onCerrarCaja={solicitarCerrarCaja}
              onIngresarEfectivo={() => abrirModalMovimiento("ingreso")}
              onRetirarEfectivo={() => abrirModalMovimiento("retiro")}
            />

            {!cajaAbierta && (
              <p className="mt-3 text-sm text-warning-600 dark:text-warning-400">
                Para realizar ventas, primero debes abrir la caja.
              </p>
            )}
          </>
        )}
      </div>

      {cajaAbierta && (
        <>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
                Ventas
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-dark-200">
                Gestiona las ventas del punto de venta seleccionado.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Columna izquierda: Formulario, categorías y productos */}
            <div className="flex-1 space-y-6">
              {/* Formulario de Cliente */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-dark-600 dark:bg-dark-800">
                <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-dark-200">
                  Información del Cliente
                </h3>
                
                {/* Campo DNI con botón de búsqueda */}
                <div className="mb-4 flex items-end gap-2">
                  <div className="w-48">
                    <Input
                      label="DNI"
                      placeholder="Ingrese DNI"
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      disabled={isLoadingCliente}
                      maxLength={12}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          loadClienteByDni(dni);
                        }
                      }}
                    />
                  </div>
                  <Button
                    color="primary"
                    onClick={() => loadClienteByDni(dni)}
                    disabled={!dni || dni.length < 3 || isLoadingCliente}
                    className="h-[42px]"
                  >
                    {isLoadingCliente ? (
                      <Spinner className="size-4 border-white" />
                    ) : (
                      "Buscar Afiliado"
                    )}
                  </Button>
                  {isConsumidorFinal && (
                    <div 
                      className="flex items-center rounded-lg px-4 py-2"
                      style={{ 
                        backgroundColor: '#ef4444', 
                        border: '1px solid #ef4444',
                        color: '#ffffff'
                      }}
                    >
                      <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>
                        No Afiliado
                      </p>
                    </div>
                  )}
                </div>

                {/* Datos del cliente y familiares */}
                {clienteData && (
                  <div className="space-y-4">
                    {/* Información del Titular */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-600 dark:bg-dark-700">
                      <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-dark-200">
                        Titular
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={familiaresSeleccionados.has(`titular-${clienteData.titular.dni_titular}`)}
                            onChange={(e) => {
                              const newSeleccionados = new Set(familiaresSeleccionados);
                              if (e.target.checked) {
                                newSeleccionados.add(`titular-${clienteData.titular.dni_titular}`);
                              } else {
                                newSeleccionados.delete(`titular-${clienteData.titular.dni_titular}`);
                              }
                              setFamiliaresSeleccionados(newSeleccionados);
                            }}
                            // disabled={clienteData.titular.compro_hoy === true}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-dark-50">
                              {clienteData.titular.nombre_titular} {clienteData.titular.apellido_titular}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-dark-400">
                              DNI: {clienteData.titular.dni_titular} - {clienteData.titular.convenio}
                            </p>
                          </div>
                          {clienteData.titular.compro_hoy === true && (
                            <div 
                              className="flex items-center rounded-lg px-3 py-1.5"
                              style={{ 
                                backgroundColor: '#ef4444', 
                                border: '1px solid #ef4444',
                                color: '#ffffff'
                              }}
                            >
                              <p className="text-xs font-semibold" style={{ color: '#ffffff' }}>
                                Ya ingresó
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Familiares */}
                    {clienteData.familiares && clienteData.familiares.length > 0 && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-600 dark:bg-dark-700">
                        <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-dark-200">
                          Familiares
                        </h4>
                        <div className="space-y-3">
                          {clienteData.familiares.map((familiar) => (
                            <div key={familiar.id_familiar} className="flex items-center gap-3">
                              <Checkbox
                                checked={familiaresSeleccionados.has(`familiar-${familiar.dni_familiar}`)}
                                onChange={(e) => {
                                  const newSeleccionados = new Set(familiaresSeleccionados);
                                  if (e.target.checked) {
                                    newSeleccionados.add(`familiar-${familiar.dni_familiar}`);
                                  } else {
                                    newSeleccionados.delete(`familiar-${familiar.dni_familiar}`);
                                  }
                                  setFamiliaresSeleccionados(newSeleccionados);
                                }}
                                // disabled={familiar.compro_hoy === true}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-dark-50">
                                  {familiar.nombre_familiar} {familiar.apellido_familiar}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-dark-400">
                                  DNI: {familiar.dni_familiar} - {familiar.relacion}
                                </p>
                              </div>
                              {familiar.compro_hoy === true && (
                                <div 
                                  className="flex items-center rounded-lg px-3 py-1.5"
                                  style={{ 
                                    backgroundColor: '#ef4444', 
                                    border: '1px solid #ef4444',
                                    color: '#ffffff'
                                  }}
                                >
                                  <p className="text-xs font-semibold" style={{ color: '#ffffff' }}>
                                    Ya ingresó
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resumen de seleccionados */}
                    {familiaresSeleccionados.size > 0 && (
                      <div className="rounded-lg border border-primary-200 bg-primary-50 p-3 dark:border-primary-800 dark:bg-primary-900/20">
                        <p className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                          Personas que ingresarán: {familiaresSeleccionados.size}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Grid de Productos */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-dark-200">
                  Productos
                </h3>
                {isLoadingProductos ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner color="primary" className="size-8" />
                  </div>
                ) : productos.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-dark-600 dark:bg-dark-800">
                    <p className="text-gray-500 dark:text-dark-400">
                      No hay productos disponibles
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {productos.map((producto) => (
                      <button
                        key={producto.id}
                        type="button"
                        onClick={() => {
                          setProductoSeleccionado(producto);
                          setShowPreciosModal(true);
                        }}
                        className="group flex flex-col rounded-lg border border-gray-200 bg-white p-3 text-left transition-all hover:border-primary-300 hover:shadow-md dark:border-dark-600 dark:bg-dark-800 dark:hover:border-primary-500"
                      >
                        {/* Imagen placeholder */}
                        <div className="mb-2 flex h-24 w-full items-center justify-center rounded bg-gray-100 dark:bg-dark-700">
                          <TbMountain className="size-8 text-gray-400" />
                        </div>

                        {/* Información del producto */}
                        <div className="flex-1">
                          <h4 className="mb-1 text-sm font-medium text-gray-900 dark:text-dark-50">
                            {producto.nombre}
                          </h4>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Columna derecha: Detalle de Venta */}
            <div className="w-80 shrink-0">
              <div className="sticky top-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-dark-600 dark:bg-dark-800">
                <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-dark-200">
                  Detalle
                </h3>

                {/* Lista de items */}
                <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
                  {detalleItems.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-dark-400">
                      No hay items en el detalle
                    </p>
                  ) : (
                    detalleItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-600 dark:bg-dark-700"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-dark-50 truncate">
                            {item.productoNombre}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-dark-400">
                            {item.nombreLista}: <span className="font-semibold">{item.cantidad}</span>
                          </p>
                          <p className="mt-1 text-xs text-gray-600 dark:text-dark-300">
                            ${item.precio.toFixed(2)} c/u
                          </p>
                        </div>
                        <div className="ml-2 flex flex-col items-end">
                          <button
                            type="button"
                            onClick={() => {
                              // Si es una entrada de socio, desmarcar el checkbox correspondiente
                              // El useEffect se encargará de eliminar la entrada del detalle automáticamente
                              if (item.id.startsWith("entrada-socio-")) {
                                const dni = item.id.replace("entrada-socio-", "");
                                
                                // Desmarcar el checkbox correspondiente
                                setFamiliaresSeleccionados((prev) => {
                                  const newSeleccionados = new Set(prev);
                                  // Intentar desmarcar como titular
                                  newSeleccionados.delete(`titular-${dni}`);
                                  // Intentar desmarcar como familiar
                                  newSeleccionados.delete(`familiar-${dni}`);
                                  return newSeleccionados;
                                });
                              } else {
                                // Para productos normales, eliminar directamente del detalle
                                setDetalleItems((prev) => prev.filter((i) => i.id !== item.id));
                              }
                            }}
                            className="mb-1 text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
                          >
                            <svg
                              className="size-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                          <p className="text-sm font-semibold text-gray-900 dark:text-dark-50">
                            ${item.subtotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Total */}
                <div className="mb-4 border-t border-gray-200 pt-4 dark:border-dark-600">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 dark:text-dark-200">
                      Total:
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-dark-50">
                      ${Math.round(detalleItems.reduce((sum, item) => sum + item.subtotal, 0)).toLocaleString('es-AR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}
                    </span>
                  </div>
                </div>

                {/* Métodos de pago */}
                <div className="mb-4 space-y-2">
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-dark-300">
                    Método de Pago
                  </h4>
                  {isLoadingMediosPago ? (
                    <div className="flex items-center justify-center py-4">
                      <Spinner className="size-4" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {mediosPago.map((medio) => (
                        <button
                          key={medio.id}
                          type="button"
                          onClick={() => setMetodoPagoId(medio.id)}
                          className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${
                            metodoPagoId === medio.id
                              ? "border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/30"
                              : "border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50 dark:border-dark-600 dark:bg-dark-700 dark:hover:border-primary-500"
                          }`}
                        >
                          <span className="text-lg">
                            {medio.nombre.toLowerCase().includes("efectivo") ? "💵" :
                             medio.nombre.toLowerCase().includes("tarjeta") ? "💳" :
                             medio.nombre.toLowerCase().includes("transferencia") ? "🏦" :
                             medio.nombre.toLowerCase().includes("mercado") ? "🛒" :
                             medio.nombre.toLowerCase().includes("qr") ? "📱" : "💳"}
                          </span>
                          <span>{medio.nombre}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botón Cobrar */}
                <Button
                  color="primary"
                  className="w-full"
                  disabled={(!clienteData && !isConsumidorFinal) || !dni || detalleItems.length === 0 || (!isConsumidorFinal && familiaresSeleccionados.size === 0) || isProcesandoVenta}
                  onClick={handleCobrar}
                >
                  {isProcesandoVenta ? (
                    <>
                      <Spinner className="mr-2 size-4 border-white" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      Cobrar
                      <span className="ml-2">
                        ${Math.round(detalleItems.reduce((sum, item) => sum + item.subtotal, 0)).toLocaleString('es-AR', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </>
                  )}
                </Button>
                {!clienteData && dni && (
                  <p className="mt-2 text-xs text-warning-600 dark:text-warning-400">
                    Debe buscar y asignar un cliente antes de cobrar
                  </p>
                )}
                {clienteData && familiaresSeleccionados.size === 0 && (
                  <p className="mt-2 text-xs text-warning-600 dark:text-warning-400">
                    Debe seleccionar al menos una persona que ingresará
                  </p>
                )}
                {!dni && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-dark-400">
                    Ingrese un DNI y busque el cliente para continuar
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modales de caja / movimientos */}
      <MovimientoModal
        show={showMovimientoModal}
        tipo={movimientoTipo}
        monto={monto}
        descripcion={descripcion}
        loading={movimientoLoading}
        puntoDeVenta={currentPv}
        onMontoChange={setMonto}
        onDescripcionChange={setDescripcion}
        onCancel={cerrarModalMovimiento}
        onConfirm={handleConfirmarMovimiento}
      />

      <ConfirmModal
        show={showConfirmModal}
        onClose={closeConfirmModal}
        onOk={confirmarAccion}
        state={confirmState}
        confirmLoading={confirmLoading}
        messages={getConfirmMessages()}
      />

      {/* Modal de Listas de Precios */}
      <ProductoPreciosModal
        show={showPreciosModal}
        producto={productoSeleccionado}
        onClose={() => {
          setShowPreciosModal(false);
          setProductoSeleccionado(null);
        }}
        onAgregar={(items) => {
          if (!productoSeleccionado) return;
          
          const nuevosItems: DetalleItem[] = items.map((item, index) => ({
            id: `${productoSeleccionado.id}-${item.listaPrecioId}-${Date.now()}-${index}`,
            productoId: productoSeleccionado.id,
            productoNombre: productoSeleccionado.nombre,
            listaPrecioId: item.listaPrecioId,
            nombreLista: item.nombreLista,
            cantidad: item.cantidad,
            precio: item.precio,
            subtotal: item.precio * item.cantidad,
            // Productos extra: afiliado_id = null, es_titular = false
            afiliadoId: null,
            esTitular: false,
          }));
          
          setDetalleItems((prev) => [...prev, ...nuevosItems]);
        }}
      />

      {/* Modal de Venta Exitosa */}
      <ConfirmModal
        show={showVentaExitoModal}
        onClose={handleCerrarModalExito}
        onOk={handleCerrarModalExito}
        state="success"
        confirmLoading={false}
        messages={{
          success: {
            title: "Venta realizada exitosamente",
            description: "La venta se ha procesado correctamente y el recibo se ha generado.",
            actionText: "Aceptar",
          },
        }}
      />

      {/* Modal de Error en Venta */}
      <ConfirmModal
        show={showVentaErrorModal}
        onClose={handleCerrarModalError}
        onOk={handleCerrarModalError}
        state="error"
        confirmLoading={false}
        messages={{
          error: {
            title: "Error al procesar la venta",
            description: ventaErrorMessage,
            actionText: "Cerrar",
          },
        }}
      />

      {/* Modal de Procesando Venta */}
      {isProcesandoVenta && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-xl dark:border-dark-600 dark:bg-dark-800">
            <div className="flex flex-col items-center gap-4">
              <Spinner color="primary" className="size-12" />
              <p className="text-lg font-semibold text-gray-900 dark:text-dark-50">
                Procesando venta...
              </p>
              <p className="text-sm text-gray-500 dark:text-dark-400">
                Por favor, espera un momento
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
