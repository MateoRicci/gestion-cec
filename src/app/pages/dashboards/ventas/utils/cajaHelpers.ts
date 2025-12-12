/**
 * Utilidades para el módulo de caja
 */

/**
 * Obtiene la fecha de hoy en formato legible en español
 * @returns Fecha formateada (ej: "29 de noviembre de 2025")
 */
export const getFechaHoy = (): string => {
  const hoy = new Date();
  return hoy.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

