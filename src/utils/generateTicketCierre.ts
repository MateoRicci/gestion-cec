/**
 * GENERACIÓN DE TICKET DE CIERRE DE CAJA
 * 
 * Este archivo contiene la función `generateTicketCierre` que crea un PDF con el resumen
 * de cierre de caja en formato ticketera (79mm de ancho).
 * 
 * ORIGEN DE LOS DATOS:
 * Los datos provienen de la función `handleCerrarCaja` en:
 * `src/app/pages/dashboards/ventas/hooks/useCajaActions.ts`
 * 
 * DATOS QUE RECIBE:
 * - caja: Información de la caja (id, nombre, descripción, usuarioApertura)
 *   → Se obtiene de: `/api/cajas/abierta` (endpoint de caja abierta)
 *   → usuarioApertura: Se obtiene del localStorage (auth-storage)
 * 
 * - movimientos: Resumen de movimientos manuales agrupados por tipo
 *   → Se obtiene de: `/api/cajas/${cajaId}/movimientos`
 *   → Se filtran movimientos manuales (excluyendo ventas)
 *   → Se agrupan por tipo (Ingreso/Egreso) y subtipo (Mayor/Menor)
 * 
 * - balanceEfectivo: Balance de efectivo (ingresos, egresos, ventas en efectivo, total)
 *   → ingresos: Suma de todos los movimientos con monto > 0
 *   → egresos: Suma absoluta de todos los movimientos con monto < 0
 *   → ventasEfectivo: Suma de ventas pagadas en efectivo
 *   → total: ingresos - egresos + ventasEfectivo
 * 
 * - balanceMetodosPago: Resumen de ventas por método de pago
 *   → Se obtiene de: `/api/ventas?caja_id=${cajaId}`
 *   → Se agrupa por método de pago (obtenido de `/api/medios-pago`)
 *   → Se suman los montos totales de cada venta por método
 * 
 * - resumenConvenios: Resumen de entradas por convenio
 *   → Se obtiene de las ventas (`/api/ventas?caja_id=${cajaId}`)
 *   → Se procesa según si el cliente tiene afiliado/convenio
 *   → Precios: Convenio = $0, Sin convenio = $5000
 *   → Se agrupa por tipo de convenio y se cuenta cantidad de entradas
 * 
 * - fechaCierre: Fecha y hora del cierre formateada en español argentino
 *   → Se genera con: `new Date().toLocaleDateString("es-AR", {...})`
 * 
 * FUNCIONALIDAD:
 * 1. Calcula el alto necesario del PDF según la cantidad de datos
 * 2. Crea un PDF con jsPDF en formato ticketera (79mm ancho)
 * 3. Genera el contenido del ticket con:
 *    - Encabezado (título, fecha, punto de venta, usuario)
 *    - Movimientos en efectivo (ingresos, ventas, egresos, saldo)
 *    - Entradas por método de pago
 *    - Total general
 * 4. Descarga automáticamente el PDF con nombre: `cierre_caja_{id}_{fecha}.pdf`
 */

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

interface PersonasPorConvenio {
  convenio: string;
  cantidad: number;
}

interface TicketCierreData {
  caja: CajaInfo;
  movimientos: MovimientoResumen[];
  balanceEfectivo: {
    ingresos: number;
    egresos: number;
    ventasEfectivo: number;
    ventasEfectivoCanceladas: number;
    total: number;
  };
  balanceMetodosPago: BalanceMetodoPago[];
  resumenConvenios: ResumenConvenio[];
  personasPorConvenio: PersonasPorConvenio[];
  fechaCierre: string;
}

export async function generateTicketCierre(data: TicketCierreData): Promise<void> {
  const { caja, balanceEfectivo, balanceMetodosPago, resumenConvenios, personasPorConvenio, fechaCierre } = data;

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

  // Personas por convenio
  estimatedHeight += 4 + (personasPorConvenio.length * 3) + 4;

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
  const ventasCanceladasFormateado = Math.round(balanceEfectivo.ventasEfectivoCanceladas).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  const totalEfectivoFormateado = Math.round(balanceEfectivo.total).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  doc.text(`Ingresos manuales: $${ingresosFormateado}`, marginLeft, yPosition, { align: "left" });
  yPosition += 3;
  doc.text(`Ventas: $${ventasEfectivoFormateado}`, marginLeft, yPosition, { align: "left" });
  yPosition += 3;
  // Mostrar ventas canceladas solo si hay alguna
  if (balanceEfectivo.ventasEfectivoCanceladas > 0) {
    doc.text(`Ventas canceladas: $${ventasCanceladasFormateado}`, marginLeft, yPosition, { align: "left" });
    yPosition += 3;
  }
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

  let estadias: PersonasPorConvenio[] = [];
  let turnos: PersonasPorConvenio[] = [];

  // Cantidad de personas ingresadas por tipo de convenio
  if (personasPorConvenio.length > 0) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("CANTIDAD DE PERSONAS POR CONVENIO", marginLeft, yPosition, { align: "left" });
    doc.setFont("helvetica", "normal");
    yPosition += 4;

    personasPorConvenio.forEach((item) => {
      // si en ote.convenio es Estadia entonces dias, si no persona

      if (item.convenio.includes('PCD')) {
        const index = item.convenio.indexOf('-')
        item.convenio = item.convenio.substring(0, index - 1)
      }

      if (item.convenio.includes('Turno')) {
        const index = item.convenio.indexOf('-')
        item.convenio = item.convenio.substring(0, index - 1)
        turnos.push(item)
        return
      }
      let type_i = 'personas'
      if (item.convenio.includes('Estadia')) {
        type_i = 'estadias'
        //sacar lo que esta despues del guion
        const index = item.convenio.indexOf('-')
        item.convenio = item.convenio.substring(0, index - 1)
        estadias.push(item)
      } else {
        doc.text(`${item.convenio}: ${item.cantidad} ${type_i}`, marginLeft, yPosition, { align: "left" });
      }
      yPosition += 3;
    });

    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
    yPosition += 4;


    // cantidad de estadias
    if (estadias.length > 0) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("CANTIDAD DE ESTADIAS", marginLeft, yPosition, { align: "left" });
      doc.setFont("helvetica", "normal");
      yPosition += 4;

      estadias.forEach((item) => {
        doc.text(`${item.convenio}: ${item.cantidad} estadias`, marginLeft, yPosition, { align: "left" });
        yPosition += 3;
      });

      yPosition += 3;

      // Línea separadora
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
      yPosition += 4;
    }

    yPosition += 3;

    // cantidad de turnos
    if (turnos.length > 0) {
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("CANTIDAD DE TURNOS", marginLeft, yPosition, { align: "left" });
      doc.setFont("helvetica", "normal");
      yPosition += 4;

      turnos.forEach((item) => {
        doc.text(`${item.convenio}: ${item.cantidad} turnos`, marginLeft, yPosition, { align: "left" });
        yPosition += 3;
      });

      yPosition += 3;

      // Línea separadora
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
      yPosition += 4;
    }

    yPosition += 3;

    // Línea separadora
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
    yPosition += 5;
  }

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