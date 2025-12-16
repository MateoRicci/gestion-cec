import jsPDF from "jspdf";

interface ClienteData {
  titular: {
    nombre_titular: string;
    apellido_titular: string;
    dni_titular: string;
    convenio: string;
    id_cliente_titular?: string;
  };
}

interface DetalleItem {
  productoNombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  nombreLista?: string;
  afiliadoId?: string | null; // id_afiliado si es entrada de afiliado, null si es extra/no afiliado
}

interface PuntoDeVenta {
  id: number;
  nombre: string;
}

interface ReciboData {
  cliente: ClienteData;
  detalleItems: DetalleItem[];
  puntoDeVenta: PuntoDeVenta;
  metodoPago: string;
  numeroRecibo?: string;
}


export async function generateRecibo(data: ReciboData): Promise<void> {
  const { cliente, detalleItems, metodoPago, numeroRecibo, puntoDeVenta } = data;

  // Calcular el alto necesario aproximado antes de crear el PDF
  const pageWidth = 79; // Ancho ticketera en mm
  const marginTop = 5;
  const marginBottom = 5;
  
  // Estimación del alto necesario:
  let estimatedHeight = marginTop;
  
  // Logo eliminado - no se incluye en el cálculo
  
  // Encabezado (línea, título, empresa, fecha, número, PV)
  estimatedHeight += 4 + 6 + 10 + 4 + 4 + 4 + 4; // ~36mm
  
  // Cliente (nombre puede ser múltiples líneas) - solo si es afiliado
  const convenioEst = cliente.titular.convenio?.toLowerCase() || "";
  const esAfiliadoEst = !convenioEst.includes("no afiliado") && !convenioEst.includes("consumidor final");
  if (esAfiliadoEst) {
    const nombreClienteEst = `${cliente.titular.nombre_titular} ${cliente.titular.apellido_titular}`;
    // Calcular líneas basado en ancho de contenido (aproximadamente 25-30 caracteres por línea a 7pt)
    const clienteLines = Math.ceil(nombreClienteEst.length / 25);
    const convenioLinesEst = Math.ceil((cliente.titular.convenio?.length || 0) / 25);
    // Incluir DNI y convenio
    estimatedHeight += 4 + (clienteLines * 3) + 3 + 3 + (convenioLinesEst * 3) + 3 + 4; // ~28-38mm
  }
  
  // Detalle (cada item puede tener múltiples líneas)
  estimatedHeight += 4; // Encabezado DETALLE
  detalleItems.forEach((item) => {
    // Considerar que el nombre puede modificarse (agregar "No Afiliado")
    let nombreProducto = item.productoNombre;
    const esEntrada = nombreProducto.toLowerCase().includes("entrada");
    const nombreListaEsNoAfiliado = item.nombreLista?.toLowerCase().includes("no afiliado");
    const esEntradaManual = esEntrada && (item.afiliadoId === null || item.afiliadoId === undefined);
    if (nombreListaEsNoAfiliado || (esEntradaManual && !nombreProducto.toLowerCase().includes("afiliado") && !nombreProducto.toLowerCase().includes("socio"))) {
      nombreProducto = nombreProducto + " No Afiliado"; // Estimación del nombre final
    }
    const productoLines = Math.ceil(nombreProducto.length / 25);
    estimatedHeight += (productoLines * 3) + 4 + 2; // ~10-15mm por item
  });
  
  // Total y pago
  estimatedHeight += 3 + 5 + 6 + 4 + 3 + 6 + 5 + 5; // ~37mm
  
  // Agregar margen de seguridad (20%)
  estimatedHeight = Math.ceil(estimatedHeight * 1.2) + marginBottom;
  
  // Mínimo 100mm, máximo razonable 500mm
  const pageHeight = Math.max(100, Math.min(500, estimatedHeight));
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [pageWidth, pageHeight], // Formato personalizado 79mm x alto dinámico
  });

  // Configuración de márgenes y espaciado para ticketera
  const marginLeft = 3;
  const marginRight = 3;
  // marginTop ya está declarado arriba, recalcular contentWidth con los márgenes correctos
  const contentWidth = pageWidth - marginLeft - marginRight;
  let yPosition = marginTop;

  // Sin colores, todo en negro

  // Logo eliminado - no se muestra en el recibo

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
  yPosition += 4;

  // Encabezado principal - Título "CEC" (más pequeño)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("CEC", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 6;

  // Información del emisor (más compacta)
  const nombreEmpresa = "Predio Centro de Empleados de Comercio";
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  const empresaLines = doc.splitTextToSize(nombreEmpresa, contentWidth);
  doc.text(empresaLines, pageWidth / 2, yPosition, { align: "center" });
  yPosition += empresaLines.length * 3 + 3;

  // Fecha y número del recibo (más compacto)
  const fecha = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hora = new Date().toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha: ${fecha} ${hora}`, marginLeft, yPosition, { align: "left" });
  yPosition += 4;

  if (numeroRecibo) {
    doc.text(`Nro: ${numeroRecibo}`, marginLeft, yPosition, { align: "left" });
    yPosition += 4;
  }

  // Punto de venta
  if (puntoDeVenta) {
    doc.text(`PV: ${puntoDeVenta.nombre}`, marginLeft, yPosition, { align: "left" });
    yPosition += 4;
  }

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
  yPosition += 4;

  // Verificar si el cliente es un afiliado (no mostrar sección si es "No Afiliado" o "Consumidor Final")
  const convenio = cliente.titular.convenio?.toLowerCase() || "";
  const esAfiliado = !convenio.includes("no afiliado") && !convenio.includes("consumidor final");

  // Sección de Cliente/Afiliado (solo si es afiliado)
  if (esAfiliado) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("AFILIADO/A", marginLeft, yPosition, { align: "left" });
    
    doc.setFont("helvetica", "normal");
    yPosition += 4;
    
    // Nombre y apellido con etiqueta
    doc.setFont("helvetica", "bold");
    doc.text("Nombre y Apellido:", marginLeft, yPosition, { align: "left" });
    yPosition += 3;
    doc.setFont("helvetica", "normal");
    const nombreCliente = `${cliente.titular.nombre_titular} ${cliente.titular.apellido_titular}`;
    const nombreClienteLines = doc.splitTextToSize(nombreCliente, contentWidth);
    doc.text(nombreClienteLines, marginLeft, yPosition, { align: "left" });
    yPosition += nombreClienteLines.length * 3;
    
    doc.text(`DNI: ${cliente.titular.dni_titular}`, marginLeft, yPosition, { align: "left" });
    yPosition += 3;
    
    const convenioLines = doc.splitTextToSize(`Conv: ${cliente.titular.convenio}`, contentWidth);
    doc.text(convenioLines, marginLeft, yPosition, { align: "left" });
    yPosition += convenioLines.length * 3 + 3;

    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
    yPosition += 4;
  }

  // Encabezado de productos (más simple)
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("DETALLE", marginLeft, yPosition, { align: "left" });
  yPosition += 4;

  // Filas de productos (formato simplificado para ticketera)
  detalleItems.forEach((item, index) => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    
    // Nombre del producto (puede ocupar varias líneas)
    let nombreProducto = item.productoNombre;
    
    // Primero corregir cualquier typo "No Socioes" o "No Afiliadoes" a "No Afiliado"
    nombreProducto = nombreProducto.replace(/no\s+socioes/gi, "No Afiliado");
    nombreProducto = nombreProducto.replace(/no\s+afiliadoes/gi, "No Afiliado");
    
    // Cambiar "No Socio" por "No Afiliado" (antes de otros reemplazos)
    nombreProducto = nombreProducto.replace(/no\s+socio/gi, "No Afiliado");
    
    // Verificar si ya tiene "No Afiliado" para evitar duplicados
    const yaTieneNoAfiliado = nombreProducto.toLowerCase().includes("no afiliado");
    
    // Verificar si es una entrada de afiliado con Mayor o Menor (importante preservar esta distinción)
    const tieneAfiliadoMayor = nombreProducto.toLowerCase().includes("afiliado mayor");
    const tieneAfiliadoMenor = nombreProducto.toLowerCase().includes("afiliado menor");
    const tieneAfiliadoMayorOMenor = tieneAfiliadoMayor || tieneAfiliadoMenor;
    
    // Cambiar "Socio" por "Afiliado" en las entradas de socios (solo si no es "No Afiliado" y no tiene ya "Afiliado Mayor/Menor")
    if (nombreProducto.toLowerCase().includes("socio") && !yaTieneNoAfiliado && !tieneAfiliadoMayorOMenor) {
      nombreProducto = nombreProducto.replace(/socio/gi, "Afiliado");
    }
    
    // Determinar si es una entrada "no afiliado"
    // Es "no afiliado" si:
    // 1. El nombreLista contiene "no afiliado"
    // 2. O es una entrada (nombre contiene "entrada") y afiliadoId es null (agregada manualmente)
    // IMPORTANTE: NO es "no afiliado" si ya tiene "Afiliado Mayor" o "Afiliado Menor"
    const esEntrada = nombreProducto.toLowerCase().includes("entrada");
    const nombreListaEsNoAfiliado = item.nombreLista?.toLowerCase().includes("no afiliado");
    const esEntradaManual = esEntrada && (item.afiliadoId === null || item.afiliadoId === undefined);
    const esNoAfiliado = (nombreListaEsNoAfiliado || (esEntradaManual && !yaTieneNoAfiliado)) && !tieneAfiliadoMayorOMenor;
    
    // Si es una entrada "no afiliado" y no lo indica en el nombre, agregarlo
    // PERO solo si NO es una entrada de afiliado con Mayor o Menor
    if (esNoAfiliado && !yaTieneNoAfiliado && !tieneAfiliadoMayorOMenor) {
      // Si el nombre del producto contiene "entrada", reemplazar o agregar "No Afiliado"
      if (esEntrada) {
        // Si dice "Entrada Mayor" o "Entrada Menor" (sin "Afiliado"), cambiar a "Entrada No Afiliado"
        // PERO NO cambiar si ya dice "Entrada Afiliado Mayor" o "Entrada Afiliado Menor"
        if (nombreProducto.toLowerCase().match(/^entrada\s+(mayor|menor)$/i)) {
          nombreProducto = "Entrada No Afiliado";
        } else if (nombreProducto.toLowerCase().trim() === "entrada") {
          // Si solo dice "Entrada" (sin más texto), agregar "No Afiliado"
          nombreProducto = "Entrada No Afiliado";
        } else if (!nombreProducto.toLowerCase().includes("no afiliado") && !tieneAfiliadoMayorOMenor) {
          // Si contiene "Entrada" al inicio pero no "No Afiliado" ni "Afiliado Mayor/Menor", agregarlo
          nombreProducto = nombreProducto.replace(/^entrada\s+/i, "Entrada No Afiliado ");
        }
      } else {
        nombreProducto = `${nombreProducto} (No Afiliado)`;
      }
    }
    
    // Verificación final: corregir cualquier duplicado o typo que pueda haber quedado
    nombreProducto = nombreProducto.replace(/no\s+afiliado\s+no\s+afiliado/gi, "No Afiliado");
    nombreProducto = nombreProducto.replace(/no\s+afiliadoes/gi, "No Afiliado");
    
    const productoLines = doc.splitTextToSize(nombreProducto, contentWidth);
    doc.text(productoLines, marginLeft, yPosition, { align: "left" });
    yPosition += productoLines.length * 3;
    
    // Cantidad, precio unitario y subtotal en una línea
    const detalleLine = `${item.cantidad} x $${item.precio.toFixed(2)} = $${item.subtotal.toFixed(2)}`;
    doc.text(detalleLine, marginLeft, yPosition, { align: "left" });
    yPosition += 4;
    
    // Línea separadora entre items (excepto el último)
    if (index < detalleItems.length - 1) {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.1);
      doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
      yPosition += 2;
    }
  });

  yPosition += 3;

  // Línea separadora antes del total
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);

  yPosition += 5;

  // Sección de totales (alineado a la derecha, más compacta)
  const total = detalleItems.reduce((sum, item) => sum + item.subtotal, 0);

  // Formatear el total sin decimales y con separadores de miles (puntos)
  const totalFormateado = Math.round(total).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL A PAGAR:", marginLeft, yPosition, { align: "left" });
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`$${totalFormateado}`, marginLeft + contentWidth, yPosition, { align: "right" });

  yPosition += 6;

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
  yPosition += 4;

  // Sección de forma de pago (más compacta)
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("MEDIO DE PAGO UTILIZADO:", marginLeft, yPosition, { align: "left" });
  doc.setFont("helvetica", "normal");
  yPosition += 3;
  
  // Mostrar el método de pago seleccionado
  doc.text(metodoPago, marginLeft, yPosition, { align: "left" });
  yPosition += 6;

  // Línea final
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
  yPosition += 5;

  // Mensaje de agradecimiento (opcional, más pequeño)
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("¡Gracias por su visita!", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 5; // Espacio final después del mensaje

  // El PDF ya fue creado con el alto estimado, así que debería ajustarse bien
  // Si el contenido excede el alto, jsPDF automáticamente agregará una nueva página
  // pero para ticketeras, queremos evitar eso, así que el cálculo inicial debería ser suficiente

  // Descargar el PDF con un nombre de archivo descriptivo
  const fechaSafe = fecha.replace(/[^\d-]/g, "_");
  const nro = numeroRecibo || "sin_numero";
  const fileName = `entrada_${nro}_${fechaSafe}.pdf`;

  const pdfBlob = doc.output("blob");
  const blobUrl = URL.createObjectURL(pdfBlob);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(blobUrl);
}
