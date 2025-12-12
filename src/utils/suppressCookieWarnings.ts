/**
 * Suprime los warnings de cookies en la consola del navegador
 * Estos warnings aparecen cuando las cookies de terceros no tienen el atributo 'Partitioned'
 * La solución real debe implementarse en el backend configurando la cookie correctamente
 */
export function suppressCookieWarnings() {
  if (typeof window === "undefined") return;

  const originalWarn = console.warn;
  
  console.warn = (...args: any[]) => {
    // Filtrar warnings relacionados con cookies
    const message = args.join(" ");
    if (
      message.includes("Cookie") &&
      (message.includes("Partitioned") || message.includes("foreign"))
    ) {
      // Suprimir este warning
      return;
    }
    
    // Mostrar otros warnings normalmente
    originalWarn.apply(console, args);
  };
}

