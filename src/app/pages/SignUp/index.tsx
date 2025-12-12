// Import Dependencies
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { EnvelopeIcon, LockClosedIcon, UserIcon, IdentificationIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, Controller } from "react-hook-form";

// Local Imports
import logoImage from "@/assets/Recurso-1CEC-bco.png";
import DashboardCheck from "@/assets/illustrations/dashboard-check.svg?react";
import { Button, Input, Select, InputErrorMsg } from "@/components/ui";
import { SignUpFormValues, step1Schema, step2Schema, TIPOS_DOCUMENTO } from "./schema";
import { Page } from "@/components/shared/Page";
import { useThemeContext } from "@/app/contexts/theme/context";
import { CSSProperties } from "react";
import { AnimatedTick } from "@/components/shared/AnimatedTick";
import axios from "@/utils/axios";

// ----------------------------------------------------------------------

// Opciones de tipo de documento para el Select (usando IDs como valores)
const TIPO_DOCUMENTO_OPTIONS = TIPOS_DOCUMENTO.map((tipo) => ({
  label: tipo.nombre,
  value: tipo.id.toString(),
}));

export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<{
    tipoDocumento: number;
    numeroDocumento: string;
    personaId: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [documentNotFound, setDocumentNotFound] = useState(false);
  const [userAlreadyExists, setUserAlreadyExists] = useState(false);

  const {
    primaryColorScheme: primary,
    lightColorScheme: light,
    darkColorScheme: dark,
    isDark,
  } = useThemeContext();

  // Formulario para el paso 1
  const step1Form = useForm({
    resolver: yupResolver(step1Schema),
    defaultValues: {
      tipoDocumento: 0,
      numeroDocumento: "",
    },
  });

  // Formulario para el paso 2
  const step2Form = useForm({
    resolver: yupResolver(step2Schema),
    mode: "onBlur", // Valida cuando el usuario sale del campo
    defaultValues: {
      usuario: "",
      email: "",
      password: "",
    },
  });

  const verifyDocument = async (data: { tipoDocumento: number; numeroDocumento: string }) => {
    setIsVerifying(true);
    setVerificationError(null);
    setDocumentNotFound(false);
    setUserAlreadyExists(false);

    try {
      // Llamada GET al endpoint de validación
      const response = await axios.get(
        `/personas/tipo-documento/${data.tipoDocumento}/documento/${data.numeroDocumento}`
      );

      // Si la respuesta es exitosa, guardar el ID de la persona
      const personaId = response.data.id;
      
      setStep1Data({
        ...data,
        personaId,
      });
      setStep(2);
    } catch (error: any) {
      // Manejar error 404 - documento no encontrado
      // El interceptor puede devolver error.response?.data (con statusCode) o el error original (con response.status)
      if (error?.statusCode === 404 || error?.response?.status === 404) {
        setDocumentNotFound(true);
        return;
      }

      // Detectar si el usuario ya existe (por mensaje de error o código de estado)
      const errorMessage = error?.message || error?.response?.data?.message || "";
      const isUserExistsError = 
        errorMessage.toLowerCase().includes("ya está registrada") ||
        errorMessage.toLowerCase().includes("ya existe") ||
        error?.statusCode === 409 ||
        error?.response?.status === 409;

      if (isUserExistsError) {
        setUserAlreadyExists(true);
        return;
      }

      // Manejar otros errores de la API
      const finalErrorMessage =
        errorMessage ||
        "Error al verificar el documento. Por favor, intenta nuevamente.";
      setVerificationError(finalErrorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const onStep1Submit = async (data: { tipoDocumento: number; numeroDocumento: string }) => {
    await verifyDocument(data);
  };

  const registerUser = async (data: SignUpFormValues) => {
    setIsRegistering(true);
    setRegistrationError(null);

    try {
      // Llamada POST al endpoint de registro
      await axios.post("/auth/registrar", {
        personaId: step1Data?.personaId,
        usuario: data.usuario,
        email: data.email,
        password: data.password,
      });
      
      // Si la respuesta es exitosa, mostrar pantalla de éxito
      setIsSuccess(true);
    } catch (error: any) {
      // Mostrar mensaje genérico y amigable en lugar del error técnico
      const errorMessage = "Ocurrió un error. Por favor, inténtalo más tarde.";
      setRegistrationError(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  const onStep2Submit = async (data: { usuario: string; email: string; password: string }) => {
    const finalData: SignUpFormValues = {
      ...step1Data!,
      ...data,
    };
    await registerUser(finalData);
  };

  return (
    <Page title="Registro">
      <main className="min-h-100vh flex">
        <div className="fixed top-0 hidden p-6 lg:block lg:px-12">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="CEC Logo" className="size-12" />
          </div>
        </div>
        <div className="hidden w-full place-items-center lg:grid">
          <div className="w-full max-w-lg p-6">
            <DashboardCheck
              style={
                {
                  "--primary": primary[500],
                  "--dark-500": isDark ? dark[500] : light[200],
                  "--dark-600": isDark ? dark[600] : light[100],
                  "--dark-700": isDark ? dark[700] : light[300],
                  "--dark-450": isDark ? dark[450] : light[400],
                  "--dark-800": isDark ? dark[800] : light[400],
                } as CSSProperties
              }
              className="w-full"
            />
          </div>
        </div>
        <div className="border-gray-150 dark:bg-dark-700 flex w-full flex-col items-center bg-white lg:max-w-md ltr:border-l rtl:border-r dark:border-transparent">
          <div className="flex w-full max-w-sm grow flex-col justify-center p-5">
            {!documentNotFound && !userAlreadyExists && (
            <div className="text-center">
              <img src={logoImage} alt="CEC Logo" className="mx-auto size-16 lg:hidden" />
              <div className="mt-4 lg:mt-0">
                <h2 className="dark:text-dark-100 text-2xl font-semibold text-gray-600">
                  {isSuccess
                    ? "¡Cuenta creada exitosamente!"
                    : step === 1
                      ? "Crear cuenta"
                      : "Completa tu registro"}
                </h2>
                <p className="dark:text-dark-300 text-gray-400">
                  {isSuccess
                    ? "Tu cuenta ha sido registrada correctamente"
                    : step === 1
                      ? "Paso 1 de 2: Información de documento"
                      : "Paso 2 de 2: Información de cuenta"}
                </p>
              </div>
            </div>
            )}

            {userAlreadyExists ? (
              <div className="mt-16 flex flex-col items-center">
                <p className="text-center text-xl font-semibold text-gray-800 dark:text-dark-100">
                  Usuario ya registrado
                </p>
                <p className="mt-4 text-center text-gray-600 dark:text-dark-200">
                  Ya existe un usuario registrado con este documento.
                  <br />
                  Por favor, inicia sesión con tus credenciales.
                </p>
                <div className="mt-8 w-full">
                  <Button
                    color="primary"
                    className="h-10 w-full"
                    onClick={() => navigate("/login")}
                  >
                    Volver al inicio de sesión
                  </Button>
                </div>
              </div>
            ) : documentNotFound ? (
              <div className="mt-16 flex flex-col items-center">
                <p className="text-center text-xl font-semibold text-gray-800 dark:text-dark-100">
                  Documento no encontrado
                </p>
                <p className="mt-4 text-center text-gray-600 dark:text-dark-200">
                  El documento ingresado no se encuentra registrado en nuestro sistema.
                  <br />
                  Por favor, contactarse con administración.
                </p>
                <div className="mt-8 w-full">
                  <Button
                    color="primary"
                    className="h-10 w-full"
                    onClick={() => navigate("/login")}
                  >
                    Volver al inicio de sesión
                  </Button>
                </div>
              </div>
            ) : isSuccess ? (
              <div className="mt-16 flex flex-col items-center">
                <AnimatedTick
                  className="size-24 text-success"
                  animate={true}
                />
                <p className="mt-6 text-center text-gray-600 dark:text-dark-200">
                  Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión con tus credenciales.
                </p>
                <div className="mt-8 w-full">
                  <Button
                    color="primary"
                    className="h-10 w-full"
                    onClick={() => navigate("/login")}
                  >
                    Ir a iniciar sesión
                  </Button>
                </div>
              </div>
            ) : step === 1 ? (
              <form
                className="mt-16"
                onSubmit={step1Form.handleSubmit(onStep1Submit)}
                autoComplete="off"
              >
                <div className="space-y-4">
                  <Controller
                    name="tipoDocumento"
                    control={step1Form.control}
                    render={({ field: { ref, onChange, value, ...field } }) => (
                      <div className="relative">
                        <Select
                          unstyled
                          className="bg-gray-150 focus:ring-primary-500/50 dark:bg-dark-900 rounded-lg px-3 py-2 pr-10 transition-colors focus:ring-3 w-full"
                          data={[
                            { label: "Tipo de documento", value: "0" },
                            ...TIPO_DOCUMENTO_OPTIONS,
                          ]}
                          value={value.toString()}
                          onChange={(e) => onChange(Number(e.target.value))}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={ref}
                          error={step1Form.formState.errors?.tipoDocumento?.message}
                        />
                        <div className="pointer-events-none absolute right-3 top-0 flex h-full items-center justify-center">
                          <ChevronDownIcon className="size-5 text-gray-400 dark:text-dark-300" />
                        </div>
                      </div>
                    )}
                  />
                  <Input
                    unstyled
                    placeholder="Número de documento"
                    className="bg-gray-150 focus:ring-primary-500/50 dark:bg-dark-900 dark:placeholder:text-dark-200/70 rounded-lg px-3 py-2 transition-colors placeholder:text-gray-400 focus:ring-3"
                    prefix={
                      <IdentificationIcon
                        className="size-5 transition-colors duration-200"
                        strokeWidth="1"
                      />
                    }
                    {...step1Form.register("numeroDocumento")}
                    error={step1Form.formState.errors?.numeroDocumento?.message}
                  />
                  {verificationError && (
                    <InputErrorMsg when={!!verificationError}>
                      {verificationError}
                    </InputErrorMsg>
                  )}
                </div>
                <Button
                  type="submit"
                  color="primary"
                  className="mt-10 h-10 w-full"
                  disabled={isVerifying}
                >
                  {isVerifying ? "Verificando..." : "Continuar"}
                </Button>
              </form>
            ) : (
              <form
                className="mt-16"
                onSubmit={step2Form.handleSubmit(onStep2Submit)}
                autoComplete="off"
              >
                <div className="space-y-4">
                  <Input
                    unstyled
                    placeholder="Usuario"
                    className="bg-gray-150 focus:ring-primary-500/50 dark:bg-dark-900 dark:placeholder:text-dark-200/70 rounded-lg px-3 py-2 transition-colors placeholder:text-gray-400 focus:ring-3"
                    prefix={
                      <UserIcon
                        className="size-5 transition-colors duration-200"
                        strokeWidth="1"
                      />
                    }
                    {...step2Form.register("usuario")}
                    error={step2Form.formState.errors?.usuario?.message}
                  />
                  <Input
                    unstyled
                    type="email"
                    placeholder="Email"
                    className="bg-gray-150 focus:ring-primary-500/50 dark:bg-dark-900 dark:placeholder:text-dark-200/70 rounded-lg px-3 py-2 transition-colors placeholder:text-gray-400 focus:ring-3"
                    prefix={
                      <EnvelopeIcon
                        className="size-5 transition-colors duration-200"
                        strokeWidth="1"
                      />
                    }
                    {...step2Form.register("email")}
                    error={step2Form.formState.errors?.email?.message}
                  />
                  <Input
                    unstyled
                    type="password"
                    placeholder="Contraseña"
                    className="bg-gray-150 focus:ring-primary-500/50 dark:bg-dark-900 dark:placeholder:text-dark-200/70 rounded-lg px-3 py-2 transition-colors placeholder:text-gray-400 focus:ring-3"
                    prefix={
                      <LockClosedIcon
                        className="size-5 transition-colors duration-200"
                        strokeWidth="1"
                      />
                    }
                    {...step2Form.register("password")}
                    error={step2Form.formState.errors?.password?.message}
                  />
                  {registrationError && (
                    <InputErrorMsg when={!!registrationError}>
                      {registrationError}
                    </InputErrorMsg>
                  )}
                </div>
                <Button
                  type="submit"
                  color="primary"
                  className="mt-10 h-10 w-full"
                  disabled={isRegistering}
                >
                  {isRegistering ? "Registrando..." : "Registrarse"}
                </Button>
              </form>
            )}
            {!isSuccess && !documentNotFound && !userAlreadyExists && (
              <div className="text-xs-plus mt-4 text-center">
                <p className="line-clamp-1">
                  <span>¿Ya tienes una cuenta?</span>{" "}
                  <Link
                    className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-600 transition-colors"
                    to="/login"
                  >
                    Inicia sesión
                  </Link>
                </p>
              </div>
            )}
          </div>

          <div className="dark:text-dark-300 mt-5 mb-3 flex justify-center text-xs text-gray-400">
            <a href="##">Privacy Notice</a>
            <div className="dark:bg-dark-500 mx-2.5 my-0.5 w-px bg-gray-200"></div>
            <a href="##">Term of service</a>
          </div>
        </div>
      </main>
    </Page>
  );
}

