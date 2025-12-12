import jsPDF from "jspdf";
import logoImage from "@/assets/cec_oscuro.jpeg";

interface ClienteData {
  titular: {
    nombre_titular: string;
    apellido_titular: string;
    dni_titular: string;
    convenio: string;
  };
}

interface DetalleItem {
  productoNombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  nombreLista?: string;
}

interface PuntoDeVenta {
  id: number;
  nombre: string;
}

interface ReciboData {
  cliente: ClienteData;
  detalleItems: DetalleItem[];
  puntoDeVenta: PuntoDeVenta;
  metodoPago: "efectivo" | "tarjeta";
  numeroRecibo?: string;
}

// Función para convertir imagen a base64
function getImageBase64(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          // Intentar JPEG primero, si falla usar PNG
          let dataURL = canvas.toDataURL("image/jpeg", 0.95);
          if (!dataURL || dataURL === "data:,") {
            dataURL = canvas.toDataURL("image/png");
          }
          resolve(dataURL);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error("No se pudo obtener el contexto del canvas"));
      }
    };
    img.onerror = (error) => {
      console.error("Error al cargar la imagen:", error);
      reject(new Error("No se pudo cargar la imagen"));
    };
    img.src = imageUrl;
  });
}

export async function generateRecibo(data: ReciboData): Promise<void> {
  const { cliente, detalleItems, puntoDeVenta, metodoPago, numeroRecibo } = data;

  // Crear instancia de jsPDF en formato A4
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4", // Formato A4
  });

  // Configuración de márgenes y espaciado
  const pageWidth = 210; // Ancho A4 en mm
  const pageHeight = 297; // Alto A4 en mm
  const marginLeft = 20;
  const marginRight = 20;
  const marginTop = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let yPosition = marginTop;

  // Color azul para encabezados y líneas
  const primaryColor = [0, 100, 200]; // Azul RGB

  // Cargar y agregar logo arriba a la derecha
  try {
    const logoBase64 = await getImageBase64(logoImage);
    const logoWidth = 40; // Ancho del logo en mm
    const logoHeight = 30; // Alto del logo en mm (manteniendo proporción)
    const logoX = pageWidth - marginRight - logoWidth;
    const logoY = marginTop;
    
    // Determinar el formato de la imagen desde el base64
    const imageFormat = logoBase64.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
    doc.addImage(logoBase64, imageFormat, logoX, logoY, logoWidth, logoHeight);
  } catch (error) {
    console.warn("No se pudo cargar el logo:", error);
  }

  // Función auxiliar para agregar texto con wrap
  const addText = (
    text: string,
    x: number,
    y: number,
    options: {
      fontSize?: number;
      fontStyle?: "normal" | "bold";
      align?: "left" | "center" | "right";
      maxWidth?: number;
      color?: number[];
    } = {}
  ) => {
    const {
      fontSize = 10,
      fontStyle = "normal",
      align = "left",
      maxWidth: textMaxWidth = contentWidth,
      color,
    } = options;

    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);

    if (color) {
      doc.setTextColor(color[0], color[1], color[2]);
    } else {
      doc.setTextColor(0, 0, 0); // Negro por defecto
    }

    const lines = doc.splitTextToSize(text, textMaxWidth);
    doc.text(lines, x, y, { align });
    doc.setTextColor(0, 0, 0); // Resetear a negro
    return lines.length * (fontSize * 0.4); // Retorna altura usada
  };

  // Función para dibujar un rectángulo con borde
  const drawRect = (x: number, y: number, width: number, height: number, fillColor?: number[]) => {
    if (fillColor) {
      doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
      doc.rect(x, y, width, height, "FD"); // Fill and Draw
    } else {
      doc.rect(x, y, width, height, "D"); // Solo Draw
    }
  };

  // Encabezado principal - Título "RECIBO"
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("RECIBO", marginLeft, yPosition);
  doc.setTextColor(0, 0, 0);

  yPosition += 15;

  // Información del emisor - uno debajo del otro
  const nombreEmpresa = "Predio Centro de Empleados de Comercio";
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  addText("Nombre:", marginLeft, yPosition, { fontSize: 10, fontStyle: "bold" });
  doc.setFont("helvetica", "normal");
  addText(nombreEmpresa, marginLeft, yPosition + 5, { fontSize: 10 });

  yPosition += 10;

  // Fecha y número del recibo - uno debajo del otro
  const fecha = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hora = new Date().toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.setFont("helvetica", "bold");
  addText("Fecha:", marginLeft, yPosition, { fontSize: 10, fontStyle: "bold" });
  doc.setFont("helvetica", "normal");
  addText(`${fecha} ${hora}`, marginLeft, yPosition + 5, { fontSize: 10 });

  yPosition += 10;

  if (numeroRecibo) {
    doc.setFont("helvetica", "bold");
    addText("Número:", marginLeft, yPosition, { fontSize: 10, fontStyle: "bold" });
    doc.setFont("helvetica", "normal");
    addText(numeroRecibo, marginLeft, yPosition + 5, { fontSize: 10 });
    yPosition += 10;
  }

  yPosition += 5;

  // Sección de Cliente con caja
  const clienteBoxHeight = 30;
  drawRect(marginLeft, yPosition, contentWidth, clienteBoxHeight);
  
  yPosition += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  addText("Cliente:", marginLeft + 5, yPosition, { fontSize: 11, fontStyle: "bold", color: primaryColor });
  
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  addText(
    `${cliente.titular.nombre_titular} ${cliente.titular.apellido_titular}`,
    marginLeft + 5,
    yPosition + 6,
    { fontSize: 10 }
  );

  addText(`DNI: ${cliente.titular.dni_titular}`, marginLeft + 5, yPosition + 12, { fontSize: 10 });
  addText(`Convenio: ${cliente.titular.convenio}`, marginLeft + 5, yPosition + 18, { fontSize: 10 });

  yPosition += clienteBoxHeight + 10;

  // Tabla de detalle de productos
  const tableStartY = yPosition;
  const headerHeight = 12;
  const rowHeight = 10;
  const conceptoWidth = contentWidth * 0.5;
  const cantidadWidth = contentWidth * 0.15;
  const precioWidth = contentWidth * 0.15;
  const totalWidth = contentWidth * 0.2;

  // Encabezado de la tabla con fondo azul
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  drawRect(marginLeft, yPosition, conceptoWidth, headerHeight, primaryColor);
  drawRect(marginLeft + conceptoWidth, yPosition, cantidadWidth, headerHeight, primaryColor);
  drawRect(marginLeft + conceptoWidth + cantidadWidth, yPosition, precioWidth, headerHeight, primaryColor);
  drawRect(marginLeft + conceptoWidth + cantidadWidth + precioWidth, yPosition, totalWidth, headerHeight, primaryColor);

  // Texto del encabezado en blanco
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CONCEPTO", marginLeft + conceptoWidth / 2, yPosition + 8, { align: "center" });
  doc.text("CANTIDAD", marginLeft + conceptoWidth + cantidadWidth / 2, yPosition + 8, { align: "center" });
  doc.text("PRECIO", marginLeft + conceptoWidth + cantidadWidth + precioWidth / 2, yPosition + 8, { align: "center" });
  doc.text("TOTAL", marginLeft + conceptoWidth + cantidadWidth + precioWidth + totalWidth / 2, yPosition + 8, { align: "center" });
  doc.setTextColor(0, 0, 0);

  yPosition += headerHeight;

  // Filas de productos
  detalleItems.forEach((item, index) => {
    const rowY = yPosition + index * rowHeight;
    
    // Dibujar líneas de la fila
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(marginLeft, rowY, marginLeft + contentWidth, rowY);
    
    // Dibujar líneas verticales
    doc.line(marginLeft + conceptoWidth, tableStartY, marginLeft + conceptoWidth, rowY + rowHeight);
    doc.line(marginLeft + conceptoWidth + cantidadWidth, tableStartY, marginLeft + conceptoWidth + cantidadWidth, rowY + rowHeight);
    doc.line(marginLeft + conceptoWidth + cantidadWidth + precioWidth, tableStartY, marginLeft + conceptoWidth + cantidadWidth + precioWidth, rowY + rowHeight);

    // Contenido de la fila
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    // Concepto
    const conceptoLines = doc.splitTextToSize(item.productoNombre, conceptoWidth - 4);
    doc.text(conceptoLines, marginLeft + 2, rowY + 7, { align: "left" });
    
    // Cantidad
    doc.text(item.cantidad.toString(), marginLeft + conceptoWidth + cantidadWidth / 2, rowY + 7, { align: "center" });
    
    // Precio
    doc.text(`$${item.precio.toFixed(2)}`, marginLeft + conceptoWidth + cantidadWidth + precioWidth / 2, rowY + 7, { align: "center" });
    
    // Total
    doc.text(`$${item.subtotal.toFixed(2)}`, marginLeft + conceptoWidth + cantidadWidth + precioWidth + totalWidth / 2, rowY + 7, { align: "center" });
  });

  yPosition += detalleItems.length * rowHeight + 5;

  // Dibujar línea final de la tabla
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, yPosition, marginLeft + contentWidth, yPosition);

  yPosition += 15;

  // Sección de totales (alineado a la derecha)
  const totalesStartX = marginLeft + contentWidth - 100;
  const total = detalleItems.reduce((sum, item) => sum + item.subtotal, 0);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  addText("TOTAL A PAGAR:", totalesStartX, yPosition, { fontSize: 12, fontStyle: "bold", align: "right", maxWidth: 100 });
  
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  addText(`$${total.toFixed(2)}`, marginLeft + contentWidth, yPosition + 6, { fontSize: 14, fontStyle: "bold", align: "right", maxWidth: 100, color: primaryColor });
  doc.setTextColor(0, 0, 0);

  yPosition += 20;

  // Sección de forma de pago
  const formaPagoBoxWidth = 80;
  const formaPagoBoxHeight = 25;
  
  // Caja de forma de pago
  drawRect(marginLeft, yPosition, formaPagoBoxWidth, formaPagoBoxHeight);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  addText("FORMA DE PAGO", marginLeft + formaPagoBoxWidth / 2, yPosition + 7, { fontSize: 10, fontStyle: "bold", align: "center", color: primaryColor });
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  
  // Mostrar el método de pago seleccionado
  const metodoPagoTexto = metodoPago === "efectivo" ? "Efectivo" : "Tarjeta";
  addText(metodoPagoTexto, marginLeft + formaPagoBoxWidth / 2, yPosition + 15, { fontSize: 9, align: "center" });

  // Abrir el PDF en una nueva pestaña en lugar de descargarlo
  doc.output("dataurlnewwindow");
}
