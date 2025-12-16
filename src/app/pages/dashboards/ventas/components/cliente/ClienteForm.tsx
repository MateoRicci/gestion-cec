/**
 * Componente para buscar y seleccionar clientes/afiliados
 */
import { Button, Input, Checkbox } from "@/components/ui";
import { Spinner } from "@/components/ui/Spinner";
import { ClienteData } from "../../types";

interface ClienteFormProps {
  dni: string;
  onDniChange: (dni: string) => void;
  onBuscar: () => void;
  isLoading: boolean;
  clienteData: ClienteData | null;
  isConsumidorFinal: boolean;
  familiaresSeleccionados: Set<string>;
  onToggleFamiliar: (key: string) => void;
}

export function ClienteForm({
  dni,
  onDniChange,
  onBuscar,
  isLoading,
  clienteData,
  isConsumidorFinal,
  familiaresSeleccionados,
  onToggleFamiliar,
}: ClienteFormProps) {
  return (
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
            onChange={(e) => onDniChange(e.target.value)}
            disabled={isLoading}
            maxLength={12}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onBuscar();
              }
            }}
          />
        </div>
        <Button
          color="primary"
          onClick={onBuscar}
          disabled={!dni || dni.length < 3 || isLoading}
          className="h-[42px]"
        >
          {isLoading ? (
            <Spinner className="size-4 border-white" />
          ) : (
            "Buscar Afiliado"
          )}
        </Button>
        {isConsumidorFinal && (
          <div
            className="flex items-center rounded-lg px-4 py-2"
            style={{
              backgroundColor: "#ef4444",
              border: "1px solid #ef4444",
              color: "#ffffff",
            }}
          >
            <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>
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
                  checked={familiaresSeleccionados.has(
                    `titular-${clienteData.titular.dni_titular}`
                  )}
                  onChange={() => {
                    // Si el titular ya ingresó hoy, no permitir volver a marcarlo
                    if (clienteData.titular.compro_hoy === true) return;
                    onToggleFamiliar(`titular-${clienteData.titular.dni_titular}`);
                  }}
                  disabled={clienteData.titular.compro_hoy === true}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-dark-50">
                    {clienteData.titular.nombre_titular}{" "}
                    {clienteData.titular.apellido_titular}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">
                    DNI: {clienteData.titular.dni_titular} -{" "}
                    {clienteData.titular.convenio}
                  </p>
                </div>
                {clienteData.titular.compro_hoy === true && (
                  <div
                    className="flex items-center rounded-lg px-3 py-1.5"
                    style={{
                      backgroundColor: "#ef4444",
                      border: "1px solid #ef4444",
                      color: "#ffffff",
                    }}
                  >
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "#ffffff" }}
                    >
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
                  <div
                    key={familiar.id_familiar}
                    className="flex items-center gap-3"
                  >
                    <Checkbox
                      checked={familiaresSeleccionados.has(
                        `familiar-${familiar.dni_familiar}`
                      )}
                      onChange={() => {
                        // Si el familiar ya ingresó hoy, no permitir volver a marcarlo
                        if (familiar.compro_hoy === true) return;
                        onToggleFamiliar(`familiar-${familiar.dni_familiar}`);
                      }}
                      disabled={familiar.compro_hoy === true}
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
                          backgroundColor: "#ef4444",
                          border: "1px solid #ef4444",
                          color: "#ffffff",
                        }}
                      >
                        <p
                          className="text-xs font-semibold"
                          style={{ color: "#ffffff" }}
                        >
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
  );
}

