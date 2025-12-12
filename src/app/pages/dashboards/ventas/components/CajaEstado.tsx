interface CajaEstadoProps {
  cajaAbierta: boolean;
}

export function CajaEstado({ cajaAbierta }: CajaEstadoProps) {
  return (
    <div className="mt-6 flex items-center gap-3">
      <span className="text-sm text-gray-500 dark:text-dark-200">
        Estado de la caja:
      </span>
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
          cajaAbierta
            ? "bg-emerald-500/10 text-emerald-400"
            : "bg-gray-500/10 text-gray-300"
        }`}
      >
        <span
          className={`inline-block size-2 rounded-full ${
            cajaAbierta ? "bg-emerald-400" : "bg-gray-400"
          }`}
        />
        {cajaAbierta ? "Abierta" : "Cerrada"}
      </span>
    </div>
  );
}

