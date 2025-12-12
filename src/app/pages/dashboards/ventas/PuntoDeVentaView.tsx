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
  codigoProducto: number;
  precio?: number;
  controlaStock?: boolean;
  categorias?: Array<{ id: number; nombre: string }>;
  puntosVenta?: Array<{ id: number; nombre: string }>;
}

interface ProductoResponse {
  id: number;
  nombre: string;
  descripcion: string;
  codigoProducto: number | string;
  precio?: number;
  controlaStock?: boolean;
  categoria?: Array<{ id: number; nombre: string; descripcion?: string; categoriaPadreId?: number | null; createdAt?: string; updatedAt?: string; deletedAt?: string | null }>;
  categorias?: Array<{ id: number; nombre: string }>;
  puntosVenta?: Array<{ id: number; nombre: string }>;
}

interface Familiar {
  id_familiar: number;
  id_cliente_familiar: number;
  nombre_familiar: string;
  apellido_familiar: string;
  dni_familiar: string;
  relacion: string;
}

interface Titular {
  id_titular: number;
  id_cliente_titular: number;
  nombre_titular: string;
  apellido_titular: string;
  dni_titular: string;
  convenio: string;
}

interface ClienteData {
  titular: Titular;
  familiares?: Familiar[];
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
}

// ----------------------------------------------------------------------

export function PuntoDeVentaView() {
  const {
    puntosDeVenta,
    selectedPuntoDeVentaId,
    setSelectedPuntoDeVentaId,
    cajaAbierta,
    getCajaId,
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
  const [isLoadingCliente, setIsLoadingCliente] = useState(false);
  const [familiaresSeleccionados, setFamiliaresSeleccionados] = useState<Set<string>>(new Set());
  
  // Estado para precio de entrada "no socio"
  const [precioEntradaNoSocio, setPrecioEntradaNoSocio] = useState<number | null>(null);
  const [productoEntradaId, setProductoEntradaId] = useState<number | null>(null);
  
  // Estado para método de pago seleccionado
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "tarjeta">("efectivo");

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
      const response = await axios.get<any[]>(
        `/productos/precios/producto/${productoId}`
      );
      
      // Buscar la lista de precios de "no socio" (case insensitive)
      const precioNoSocio = response.data.find((precio) =>
        precio.listaPrecio.nombre.toLowerCase().includes("no socio")
      );

      if (precioNoSocio) {
        setPrecioEntradaNoSocio(precioNoSocio.precio);
      } else {
        console.warn("No se encontró precio de 'no socio' para el producto de entrada");
        setPrecioEntradaNoSocio(null);
      }
    } catch (error) {
      console.error("Error al cargar precio de entrada no socio:", error);
      setPrecioEntradaNoSocio(null);
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
        const response = await axios.get<ProductoResponse[]>("/productos", {
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
            codigoProducto: typeof prod.codigoProducto === 'string' ? parseInt(prod.codigoProducto) : prod.codigoProducto,
            precio: prod.precio,
            controlaStock: prod.controlaStock || false,
            categorias: categoriasMapeadas,
            puntosVenta: prod.puntosVenta || [],
          };
        });
        
        console.log("Productos mapeados:", productosMapeados);
        setProductos(productosMapeados);
        
        // Buscar el producto "Entrada" o "Entradas" para obtener su precio de "no socio"
        const productoEntrada = productosMapeados.find(
          (prod) => prod.nombre.toLowerCase().includes("entrada")
        );
        
        if (productoEntrada) {
          setProductoEntradaId(productoEntrada.id);
          // Cargar precios del producto entrada
          loadPrecioEntradaNoSocio(productoEntrada.id);
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

  // Función para cargar datos del cliente por DNI (mock)
  const loadClienteByDni = async (dniValue: string) => {
    if (!dniValue || dniValue.length < 3) {
      setClienteData(null);
      setFamiliaresSeleccionados(new Set());
      return;
    }

    setIsLoadingCliente(true);
    try {
      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Datos mock
      const afiliadoData: ClienteData = {
        titular: {
          id_titular: 1,
          id_cliente_titular: 101,
          nombre_titular: "Santiago Nicolas",
          apellido_titular: "Ricci",
          dni_titular: "28008101",
          convenio: "Afiliado CEC",
        },
        familiares: [
          {
            id_familiar: 2,
            id_cliente_familiar: 102,
            nombre_familiar: "Natalia",
            apellido_familiar: "Villarruel",
            dni_familiar: "27007101",
            relacion: "Esposa",
          },
          {
            id_familiar: 3,
            id_cliente_familiar: 103,
            nombre_familiar: "Mateo",
            apellido_familiar: "Ricci Villarruel",
            dni_familiar: "44975617",
            relacion: "Hijo",
          },
        ],
      };

      const consumidorFinalData: ClienteData = {
        titular: {
          id_titular: 5,
          id_cliente_titular: 105,
          nombre_titular: "Serra",
          apellido_titular: "Franco",
          dni_titular: "36606100",
          convenio: "Consumidor Final",
        },
      };

      // Determinar qué datos devolver según el DNI buscado
      let dataToReturn: ClienteData | null = null;
      let dniBuscado = dniValue.trim();

      // Si el DNI es del titular afiliado o de algún familiar, devolver datos del afiliado
      if (
        dniBuscado === "28008101" ||
        dniBuscado === "27007101" ||
        dniBuscado === "44975617"
      ) {
        dataToReturn = afiliadoData;
      } else if (dniBuscado === "36606100") {
        dataToReturn = consumidorFinalData;
      }

      if (dataToReturn) {
        setClienteData(dataToReturn);
        
        // Marcar el DNI buscado por defecto
        const seleccionados = new Set<string>();
        if (dataToReturn.familiares) {
          // Si es el titular, marcarlo
          if (dniBuscado === dataToReturn.titular.dni_titular) {
            seleccionados.add(`titular-${dataToReturn.titular.dni_titular}`);
          }
          // Si es un familiar, marcarlo
          dataToReturn.familiares.forEach((familiar) => {
            if (dniBuscado === familiar.dni_familiar) {
              seleccionados.add(`familiar-${familiar.dni_familiar}`);
            }
          });
        } else {
          // Si no hay familiares, marcar el titular
          seleccionados.add(`titular-${dataToReturn.titular.dni_titular}`);
        }
        setFamiliaresSeleccionados(seleccionados);
      } else {
        setClienteData(null);
        setFamiliaresSeleccionados(new Set());
      }
    } catch (error) {
      console.error("Error al cargar datos del cliente:", error);
      setClienteData(null);
      setFamiliaresSeleccionados(new Set());
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

    // Obtener todas las personas seleccionadas
    const personasSeleccionadas: Array<{ dni: string; nombre: string; tipo: "titular" | "familiar" }> = [];

    // Agregar titular si está seleccionado
    if (familiaresSeleccionados.has(`titular-${clienteData.titular.dni_titular}`)) {
      personasSeleccionadas.push({
        dni: clienteData.titular.dni_titular,
        nombre: `${clienteData.titular.nombre_titular} ${clienteData.titular.apellido_titular}`,
        tipo: "titular",
      });
    }

    // Agregar familiares seleccionados
    if (clienteData.familiares) {
      clienteData.familiares.forEach((familiar) => {
        if (familiaresSeleccionados.has(`familiar-${familiar.dni_familiar}`)) {
          personasSeleccionadas.push({
            dni: familiar.dni_familiar,
            nombre: `${familiar.nombre_familiar} ${familiar.apellido_familiar}`,
            tipo: "familiar",
          });
        }
      });
    }

    // Determinar el precio según el tipo de convenio
    const esConsumidorFinal = clienteData.titular.convenio === "Consumidor Final";
    const precioEntrada = esConsumidorFinal && precioEntradaNoSocio !== null 
      ? precioEntradaNoSocio 
      : 0;

    // Actualizar el detalle: mantener productos normales y actualizar entradas de socio
    setDetalleItems((prev) => {
      // Mantener solo los items que NO son entradas de socio
      const itemsSinEntradasSocio = prev.filter((item) => !item.id.startsWith("entrada-socio-"));

      // Crear nuevas entradas de socio para las personas seleccionadas
      const nuevasEntradasSocio: DetalleItem[] = personasSeleccionadas.map((persona) => ({
        id: `entrada-socio-${persona.dni}`,
        productoId: productoEntradaId || 0,
        productoNombre: `Entrada Socio ${persona.nombre}`,
        listaPrecioId: 0,
        nombreLista: esConsumidorFinal ? "Entrada No Socio" : "Entrada Socio",
        cantidad: 1,
        precio: precioEntrada,
        subtotal: precioEntrada,
      }));

      return [...itemsSinEntradasSocio, ...nuevasEntradasSocio];
    });
  }, [familiaresSeleccionados, clienteData, precioEntradaNoSocio, productoEntradaId]);

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
    if (!clienteData || !currentPv || detalleItems.length === 0) {
      return;
    }

    // Generar número de recibo único (timestamp)
    const numeroRecibo = `REC-${Date.now()}`;

    // Generar el recibo PDF
    await generateRecibo({
      cliente: clienteData,
      detalleItems,
      puntoDeVenta: currentPv,
      metodoPago,
      numeroRecibo,
    });
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
                      "Buscar Cliente"
                    )}
                  </Button>
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
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-dark-50">
                              {clienteData.titular.nombre_titular} {clienteData.titular.apellido_titular}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-dark-400">
                              DNI: {clienteData.titular.dni_titular} - {clienteData.titular.convenio}
                            </p>
                          </div>
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
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-dark-50">
                                  {familiar.nombre_familiar} {familiar.apellido_familiar}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-dark-400">
                                  DNI: {familiar.dni_familiar} - {familiar.relacion}
                                </p>
                              </div>
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
                      ${detalleItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Métodos de pago */}
                <div className="mb-4 space-y-2">
                  <h4 className="text-xs font-semibold text-gray-600 dark:text-dark-300">
                    Método de Pago
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMetodoPago("efectivo")}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${
                        metodoPago === "efectivo"
                          ? "border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/30"
                          : "border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50 dark:border-dark-600 dark:bg-dark-700 dark:hover:border-primary-500"
                      }`}
                    >
                      <span className="text-lg">💵</span>
                      <span>Efectivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoPago("tarjeta")}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${
                        metodoPago === "tarjeta"
                          ? "border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/30"
                          : "border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50 dark:border-dark-600 dark:bg-dark-700 dark:hover:border-primary-500"
                      }`}
                    >
                      <span className="text-lg">💳</span>
                      <span>Tarjeta</span>
                    </button>
                  </div>
                </div>

                {/* Botón Cobrar */}
                <Button
                  color="primary"
                  className="w-full"
                  disabled={!clienteData || !dni || detalleItems.length === 0 || familiaresSeleccionados.size === 0}
                  onClick={handleCobrar}
                >
                  Cobrar
                  <span className="ml-2">
                    ${detalleItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}
                  </span>
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
          }));
          
          setDetalleItems((prev) => [...prev, ...nuevosItems]);
        }}
      />
    </section>
  );
}
