// Import Dependencies
import { useEffect, useState } from "react";
import { Card, GhostSpinner, Button, Select } from "@/components/ui";
import { TbUpload } from "react-icons/tb";
import axios from "@/utils/axios";

// ----------------------------------------------------------------------

interface TipoConvenio {
  id: number;
  nombre: string;
  descripcion: string | null;
}

type TipoCarga = "titulares" | "familiares" | "convenios_externos";

interface ImportarFormData {
  archivo: File | null;
  tipo_carga: TipoCarga | "";
  convenio_id: number | "";
}

const initialFormData: ImportarFormData = {
  archivo: null,
  tipo_carga: "",
  convenio_id: "",
};

export function ImportarPadronTab() {
  const [convenios, setConvenios] = useState<TipoConvenio[]>([]);
  const [isLoadingConvenios, setIsLoadingConvenios] = useState(false);
  const [formData, setFormData] = useState<ImportarFormData>(initialFormData);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadConvenios = async () => {
    setIsLoadingConvenios(true);
    try {
      const response = await axios.get<TipoConvenio[]>("/api/tipos-convenios");
      setConvenios(response.data ?? []);
    } catch (err) {
      console.error("Error al cargar convenios:", err);
    } finally {
      setIsLoadingConvenios(false);
    }
  };

  useEffect(() => {
    void loadConvenios();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, archivo: file });
    setError(null);
    setSuccess(null);
  };

  const handleTipoCargaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tipoCarga = e.target.value as TipoCarga | "";
    setFormData({
      ...formData,
      tipo_carga: tipoCarga,
      convenio_id: tipoCarga === "convenios_externos" ? formData.convenio_id : "",
    });
    setError(null);
    setSuccess(null);
  };

  const handleConvenioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      convenio_id: e.target.value ? Number(e.target.value) : "",
    });
    setError(null);
    setSuccess(null);
  };

  const validateForm = (): boolean => {
    if (!formData.archivo) {
      setError("Debes seleccionar un archivo");
      return false;
    }

    if (!formData.tipo_carga) {
      setError("Debes seleccionar un tipo de carga");
      return false;
    }

    if (formData.tipo_carga === "convenios_externos" && !formData.convenio_id) {
      setError("Debes seleccionar un convenio cuando el tipo es 'Convenios Externos'");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("archivo", formData.archivo!);
      formDataToSend.append("tipo_carga", formData.tipo_carga);

      if (formData.tipo_carga === "convenios_externos" && formData.convenio_id) {
        formDataToSend.append("convenio_id", formData.convenio_id.toString());
      }

      await axios.post("/api/afiliados/importar", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("El archivo se ha importado correctamente");
      setFormData(initialFormData);
      // Reset file input
      const fileInput = document.getElementById("archivo-input") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err: any) {
      let message = "Error al importar el archivo. Por favor, intenta nuevamente.";

      if (err?.response?.data) {
        if (typeof err.response.data === "string") {
          message = err.response.data;
        } else if (err.response.data.message) {
          message = err.response.data.message;
        } else if (err.response.data.error) {
          message = err.response.data.error;
        }
      } else if (err?.message) {
        message = err.message;
      }

      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const tipoCargaOptions = [
    { label: "Selecciona un tipo de carga", value: "" },
    { label: "Titulares", value: "titulares" },
    { label: "Familiares", value: "familiares" },
    { label: "Convenios Externos", value: "convenios_externos" },
  ];

  return (
    <div className="flex w-full flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
          Importar Padrón
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-dark-200">
          Importa archivos de padrón de afiliados al sistema
        </p>
      </div>

      {/* Form Card */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Success Message */}
          {success && (
            <div className="rounded-lg bg-success/10 p-3 text-sm text-success dark:bg-success/20 dark:text-success-light">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-error/10 p-3 text-sm text-error dark:bg-error/20 dark:text-error-light">
              {error}
            </div>
          )}

          {/* File Input */}
          <div>
            <label
              htmlFor="archivo-input"
              className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-1.5"
            >
              Archivo <span className="text-red-500">*</span>
            </label>
            <div className="mt-1.5">
              <input
                id="archivo-input"
                type="file"
                onChange={handleFileChange}
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 dark:text-dark-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100
                  dark:file:bg-primary-900/30 dark:file:text-primary-400
                  dark:hover:file:bg-primary-900/50
                  cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            {formData.archivo && (
              <p className="mt-2 text-sm text-gray-600 dark:text-dark-400">
                Archivo seleccionado: <span className="font-medium">{formData.archivo.name}</span>
              </p>
            )}
          </div>

          {/* Tipo de Carga */}
          <Select
            label="Tipo de Carga"
            value={formData.tipo_carga}
            onChange={handleTipoCargaChange}
            disabled={isUploading}
            required
            data={tipoCargaOptions}
          />

          {/* Convenio (solo si tipo_carga es convenios_externos) */}
          {formData.tipo_carga === "convenios_externos" && (
            <Select
              label="Convenio"
              value={formData.convenio_id}
              onChange={handleConvenioChange}
              disabled={isUploading || isLoadingConvenios}
              required
              data={[
                { label: "Selecciona un convenio", value: "" },
                ...convenios.map((c) => ({
                  label: c.nombre,
                  value: c.id,
                })),
              ]}
            />
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isUploading || !formData.archivo || !formData.tipo_carga}
              className="flex items-center gap-2 h-9 min-w-[7rem]"
            >
              {isUploading ? (
                <>
                  <GhostSpinner variant="soft" className="size-4 border-2" />
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <TbUpload className="h-4 w-4" />
                  <span>Importar</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}


