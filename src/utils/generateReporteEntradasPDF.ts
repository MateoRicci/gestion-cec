/**
 * GENERACIÓN DE PDF PARA REPORTE DE ENTRADAS PREDIO
 *
 * Este archivo contiene la función `generateReporteEntradasPDF` que crea un PDF
 * del reporte de entradas con los datos mostrados en pantalla.
 */

import jsPDF from "jspdf";

interface DetalleProducto {
    producto: string;
    cantidad: number;
    monto: number;
}

interface ReporteGroup {
    convenio: string;
    detalles: DetalleProducto[];
    totalCantidad: number;
    totalMonto: number;
}

interface IngresoPorMedioPago {
    medioPagoId: number;
    medioPagoNombre: string;
    totalMonto: number;
}

interface CajaInfo {
    id: number;
    descripcion: string;
    cajeroNombre: string;
}

interface ReportePDFData {
    fechaDesde: string;
    fechaHasta: string;
    caja: CajaInfo | null;
    reporteGroups: ReporteGroup[];
    ingresosPorMedioPago: IngresoPorMedioPago[];
    totalPersonas: number;
    totalMonto: number;
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
    }).format(value);
};

const formatDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
};


export async function generateReporteEntradasPDF(
    data: ReportePDFData
): Promise<void> {
    const { fechaDesde, fechaHasta, caja, reporteGroups, ingresosPorMedioPago, totalPersonas, totalMonto } = data;

    // Configuración de página A4
    const pageWidth = 210;
    const pageHeight = 297;
    const marginLeft = 15;
    const marginRight = 15;
    const marginTop = 15;
    const contentWidth = pageWidth - marginLeft - marginRight;

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    let yPosition = marginTop;

    // Título principal
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Reporte de Entradas Predio", marginLeft, yPosition + 5);

    // Subtítulo con organización
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Centro de Empleados de Comercio", marginLeft, yPosition + 12);

    yPosition += 20;

    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
    yPosition += 8;

    // Información del filtro
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Período:", marginLeft, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(
        `${formatDate(fechaDesde)} - ${formatDate(fechaHasta)}`,
        marginLeft + 20,
        yPosition
    );

    if (caja) {
        yPosition += 6;
        doc.setFont("helvetica", "bold");
        doc.text("Caja:", marginLeft, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(caja.descripcion, marginLeft + 15, yPosition);

        yPosition += 6;
        doc.setFont("helvetica", "bold");
        doc.text("Cajero:", marginLeft, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(caja.cajeroNombre, marginLeft + 18, yPosition);
    }

    // Fecha de generación
    const fechaGeneracion = new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    doc.setFontSize(8);
    doc.text(`Generado: ${fechaGeneracion}`, marginLeft + contentWidth, yPosition, {
        align: "right",
    });

    yPosition += 10;

    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
    yPosition += 8;

    // Encabezados de la tabla
    const colWidths = {
        convenio: contentWidth * 0.5,
        cantidad: contentWidth * 0.2,
        monto: contentWidth * 0.3,
    };

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(240, 240, 240);
    doc.rect(marginLeft, yPosition - 4, contentWidth, 7, "F");

    doc.text("Convenio / Producto", marginLeft + 2, yPosition);
    doc.text("Cantidad", marginLeft + colWidths.convenio + colWidths.cantidad - 5, yPosition, {
        align: "right",
    });
    doc.text("Monto", marginLeft + contentWidth - 2, yPosition, { align: "right" });

    yPosition += 6;

    // Datos de la tabla
    doc.setFontSize(8);

    for (const group of reporteGroups) {
        // Verificar si necesitamos nueva página
        if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = marginTop;
        }

        // Encabezado del grupo (convenio)
        doc.setFont("helvetica", "bold");
        doc.setFillColor(248, 248, 248);
        doc.rect(marginLeft, yPosition - 3, contentWidth, 5, "F");
        doc.text(group.convenio, marginLeft + 2, yPosition);
        yPosition += 6;

        // Detalles del grupo
        doc.setFont("helvetica", "normal");
        for (const detalle of group.detalles) {
            if (yPosition > pageHeight - 30) {
                doc.addPage();
                yPosition = marginTop;
            }

            // Producto con sangría
            doc.text(`  ${detalle.producto}`, marginLeft + 2, yPosition);
            doc.text(
                String(detalle.cantidad),
                marginLeft + colWidths.convenio + colWidths.cantidad - 5,
                yPosition,
                { align: "right" }
            );
            doc.text(formatCurrency(detalle.monto), marginLeft + contentWidth - 2, yPosition, {
                align: "right",
            });
            yPosition += 4;
        }

        // Subtotal del grupo
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text(
            `Subtotal ${group.convenio}`,
            marginLeft + colWidths.convenio - 10,
            yPosition,
            { align: "right" }
        );
        doc.text(
            String(group.totalCantidad),
            marginLeft + colWidths.convenio + colWidths.cantidad - 5,
            yPosition,
            { align: "right" }
        );
        doc.text(formatCurrency(group.totalMonto), marginLeft + contentWidth - 2, yPosition, {
            align: "right",
        });
        yPosition += 6;
        doc.setFontSize(8);
    }

    // Línea antes de totales
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
    yPosition += 6;

    // Totales desglosados
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");

    // Total Entradas (sin Estadías ni Turnos)
    const totalEntradas = reporteGroups
        .filter((g) => g.convenio !== "Estadías" && g.convenio !== "Turnos")
        .reduce((sum, g) => sum + g.totalCantidad, 0);
    const totalEntradasMonto = reporteGroups
        .filter((g) => g.convenio !== "Estadías" && g.convenio !== "Turnos")
        .reduce((sum, g) => sum + g.totalMonto, 0);

    doc.text("Total Entradas", marginLeft + 2, yPosition);
    doc.text(
        String(totalEntradas),
        marginLeft + colWidths.convenio + colWidths.cantidad - 5,
        yPosition,
        { align: "right" }
    );
    doc.text(formatCurrency(totalEntradasMonto), marginLeft + contentWidth - 2, yPosition, {
        align: "right",
    });
    yPosition += 5;

    // Total Estadías
    const totalEstadias = reporteGroups
        .filter((g) => g.convenio === "Estadías")
        .reduce((sum, g) => sum + g.totalCantidad, 0);
    const totalEstadiasMonto = reporteGroups
        .filter((g) => g.convenio === "Estadías")
        .reduce((sum, g) => sum + g.totalMonto, 0);

    doc.text("Total Estadías", marginLeft + 2, yPosition);
    doc.text(
        String(totalEstadias),
        marginLeft + colWidths.convenio + colWidths.cantidad - 5,
        yPosition,
        { align: "right" }
    );
    doc.text(formatCurrency(totalEstadiasMonto), marginLeft + contentWidth - 2, yPosition, {
        align: "right",
    });
    yPosition += 5;

    // Total Turnos
    const totalTurnos = reporteGroups
        .filter((g) => g.convenio === "Turnos")
        .reduce((sum, g) => sum + g.totalCantidad, 0);
    const totalTurnosMonto = reporteGroups
        .filter((g) => g.convenio === "Turnos")
        .reduce((sum, g) => sum + g.totalMonto, 0);

    doc.text("Total Turnos", marginLeft + 2, yPosition);
    doc.text(
        String(totalTurnos),
        marginLeft + colWidths.convenio + colWidths.cantidad - 5,
        yPosition,
        { align: "right" }
    );
    doc.text(formatCurrency(totalTurnosMonto), marginLeft + contentWidth - 2, yPosition, {
        align: "right",
    });
    yPosition += 6;

    // Total General
    doc.setFillColor(230, 230, 230);
    doc.rect(marginLeft, yPosition - 4, contentWidth, 7, "F");
    doc.setFontSize(10);
    doc.text("TOTAL GENERAL", marginLeft + 2, yPosition);
    doc.text(
        String(totalPersonas),
        marginLeft + colWidths.convenio + colWidths.cantidad - 5,
        yPosition,
        { align: "right" }
    );
    doc.text(formatCurrency(totalMonto), marginLeft + contentWidth - 2, yPosition, {
        align: "right",
    });
    yPosition += 10;

    // Sección de Ingresos por Método de Pago
    if (ingresosPorMedioPago.length > 0) {
        // Verificar si necesitamos nueva página
        if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = marginTop;
        }

        // Línea separadora
        doc.setDrawColor(100, 100, 200);
        doc.setLineWidth(0.5);
        doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);
        yPosition += 8;

        // Título sección
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(219, 234, 254); // Azul claro
        doc.rect(marginLeft, yPosition - 4, contentWidth, 7, "F");
        doc.text("MONTOS POR MÉTODO DE PAGO", marginLeft + 2, yPosition);
        yPosition += 8;

        // Detalles
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        for (const item of ingresosPorMedioPago) {
            doc.text(item.medioPagoNombre, marginLeft + 10, yPosition);
            doc.text(formatCurrency(item.totalMonto), marginLeft + contentWidth - 2, yPosition, {
                align: "right",
            });
            yPosition += 5;
        }
    }

    // Generar nombre del archivo
    const fechaSafe = fechaDesde.replace(/-/g, "");
    const fechaHastaSafe = fechaHasta.replace(/-/g, "");
    const fileName = caja
        ? `reporte_entradas_caja_${caja.id}_${fechaSafe}.pdf`
        : `reporte_entradas_${fechaSafe}_${fechaHastaSafe}.pdf`;

    // Descargar el PDF
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
