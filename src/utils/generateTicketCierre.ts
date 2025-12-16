import jsPDF from "jspdf";

interface CajaInfo {
  id: number;
  nombre: string;
  descripcion: string;
  usuarioApertura: string; // Nombre del usuario que abrió la caja
}

interface MovimientoResumen {
  tipo: string;
  subtipo?: string; // Para mayores/menores (si aplica)
  monto: number;
}

interface BalanceMetodoPago {
  metodoPago: string;
  monto: number;
}

interface ResumenConvenio {
  convenio: string;
  cantidad: number;
  monto: number;
}

interface TicketCierreData {
  caja: CajaInfo;
  movimientos: MovimientoResumen[];
  balanceEfectivo: {
    ingresos: number;
    egresos: number;
    ventasEfectivo: number;
    total: number;
  };
  balanceMetodosPago: BalanceMetodoPago[];
  resumenConvenios: ResumenConvenio[];
  fechaCierre: string;
}

export async function generateTicketCierre(data: TicketCierreData): Promise<void> {
  const { caja, balanceEfectivo, balanceMetodosPago, resumenConvenios, fechaCierre } = data;

  // Calcular el alto necesario aproximado antes de crear el PDF
  const pageWidth = 79; // Ancho ticketera en mm
  const marginTop = 5;
  const marginBottom = 5;
  
  // Estimación del alto necesario:
  let estimatedHeight = marginTop;
  
  // Encabezado (título, caja info)
  estimatedHeight += 4 + 6 + 10 + 4 + 4 + 4 + 4; // ~36mm
  
  // Balance efectivo
  estimatedHeight += 4 + 15 + 4;
  
  // Balance métodos de pago
  estimatedHeight += 4 + (balanceMetodosPago.length * 4) + 4;
  
  // Resumen convenios
  estimatedHeight += 4 + (resumenConvenios.length * 4) + 4;
  
  // Cierre final
  estimatedHeight += 4 + 10 + 5;
  
  // Agregar margen de seguridad (20%)
  estimatedHeight = Math.ceil(estimatedHeight * 1.2) + marginBottom;
  
  // Mínimo 100mm, máximo razonable 500mm
  const pageHeight = Math.max(100, Math.min(500, estimatedHeight));
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [pageWidth, pageHeight],
  });

  // Configuración de márgenes y espaciado para ticketera
  const marginLeft = 3;
  const marginRight = 3;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let yPosition = marginTop;

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
  yPosition += 4;

  // Encabezado principal - Título "CIERRE DE CAJA"
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`CIERRE DE CAJA N° ${caja.id}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 6;

  // Información de la caja
  doc.setFontSize(7);
  doc.text(`Fecha: ${fechaCierre}`, marginLeft, yPosition, { align: "left" });
  yPosition += 6;
  doc.setFont("helvetica", "normal");
  doc.text(`Punto de venta: ${caja.nombre}`, marginLeft, yPosition, { align: "left" });
  yPosition += 4;
  
  // if (caja.descripcion) {
  //   const descripcionLines = doc.splitTextToSize(caja.descripcion, contentWidth);
  //   doc.text(descripcionLines, marginLeft, yPosition, { align: "left" });
  //   yPosition += descripcionLines.length * 3;
  // }
  
  doc.text(`Usuario caja: ${caja.usuarioApertura}`, marginLeft, yPosition, { align: "left" });
  yPosition += 4;
  

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
  yPosition += 4;

  // Balance de Efectivo
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("MOVIMIENTOS EN EFECTIVO", marginLeft, yPosition, { align: "left" });
  doc.setFont("helvetica", "normal");
  yPosition += 4;

  const ingresosFormateado = Math.round(balanceEfectivo.ingresos).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  const egresosFormateado = Math.round(balanceEfectivo.egresos).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  const ventasEfectivoFormateado = Math.round(balanceEfectivo.ventasEfectivo).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  const totalEfectivoFormateado = Math.round(balanceEfectivo.total).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  doc.text(`Ingresos Manuales: $${ingresosFormateado}`, marginLeft, yPosition, { align: "left" });
  yPosition += 3;
  doc.text(`Ventas: $${ventasEfectivoFormateado}`, marginLeft, yPosition, { align: "left" });
  yPosition += 3;
  doc.text(`Egresos: $${egresosFormateado}`, marginLeft, yPosition, { align: "left" });
  yPosition += 3;
  
  doc.setFont("helvetica", "bold");
  doc.text(`Saldo Efectivo: $${totalEfectivoFormateado}`, marginLeft, yPosition, { align: "left" });
  doc.setFont("helvetica", "normal");
  yPosition += 6;

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
  yPosition += 4;

  // Entradas por Método de Pago
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("ENTRADAS POR MÉTODO DE PAGO", marginLeft, yPosition, { align: "left" });
  doc.setFont("helvetica", "normal");
  yPosition += 4;

  balanceMetodosPago.forEach((balance) => {
    const montoFormateado = Math.round(balance.monto).toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    doc.text(`${balance.metodoPago}: $${montoFormateado}`, marginLeft, yPosition, { align: "left" });
    yPosition += 3;
  });

  yPosition += 3;

  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
  yPosition += 4;

  // Resumen por Convenio
  // doc.setFontSize(7);
  // doc.setFont("helvetica", "bold");
  // doc.text("ENTRADAS POR CONVENIO", marginLeft, yPosition, { align: "left" });
  // doc.setFont("helvetica", "normal");
  // yPosition += 4;

  // resumenConvenios.forEach((convenio) => {
  //   const montoFormateado = Math.round(convenio.monto).toLocaleString('es-AR', {
  //     minimumFractionDigits: 0,
  //     maximumFractionDigits: 0
  //   });
  //   doc.text(`${convenio.convenio}: ${convenio.cantidad} entradas - $${montoFormateado}`, marginLeft, yPosition, { align: "left" });
  //   yPosition += 3;
  // });

  yPosition += 3;

  // Línea separadora
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
  yPosition += 5;

  // Cierre Final
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const totalGeneral = balanceMetodosPago.reduce((sum, b) => sum + b.monto, 0);
  const totalGeneralFormateado = Math.round(totalGeneral).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  doc.text(`TOTAL GENERAL: $${totalGeneralFormateado}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 5;

  // Mensaje final
  doc.setFontSize(6);
  doc.setFont("helvetica", "italic");
  doc.text("Caja cerrada correctamente", pageWidth / 2, yPosition, { align: "center" });

  // Descargar el PDF con un nombre de archivo descriptivo
  const safeFecha = fechaCierre.replace(/[^\d-]/g, "_");
  const fileName = `cierre_caja_${caja.id}_${safeFecha}.pdf`;

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