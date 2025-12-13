// Import Dependencies
import { Link } from "react-router";
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";

// Local Imports
import logoImage from "@/assets/Recurso-1CEC-bco.png";
import DashboardCheck from "@/assets/illustrations/dashboard-check.svg?react";
import { Button, Checkbox, Input, InputErrorMsg } from "@/components/ui";
import { useAuthContext } from "@/app/contexts/auth/context";
import { AuthFormValues, schema } from "./schema";
import { Page } from "@/components/shared/Page";
import { useThemeContext } from "@/app/contexts/theme/context";
import { CSSProperties } from "react";

// ----------------------------------------------------------------------

export default function SignIn() {
  const {
    primaryColorScheme: primary,
    lightColorScheme: light,
    darkColorScheme: dark,
    isDark,
  } = useThemeContext();

  const { login, errorMessage } = useAuthContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = (data: AuthFormValues) => {
    login({
      username: data.username,
      password: data.password,
    });
  };

  return (
    <Page title="Login">
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
            <div className="text-center">
              <img src={logoImage} alt="CEC Logo" className="mx-auto size-16 lg:hidden" />
              <div className="mt-4 lg:mt-0">
                <h2 className="dark:text-dark-100 text-2xl font-semibold text-gray-600">
                  Bienvenido de nuevo
                </h2>
                <p className="dark:text-dark-300 text-gray-400">
                  Por favor, inicia sesión para continuar
                </p>
              </div>
            </div>
            <form
              className="mt-16"
              onSubmit={handleSubmit(onSubmit)}
              autoComplete="off"
            >
              <div className="space-y-4">
                <Input
                  unstyled
                  placeholder="Usuario"
                  className="bg-gray-150 focus:ring-primary-500/50 dark:bg-dark-900 dark:placeholder:text-dark-200/70 rounded-lg px-3 py-2 transition-colors placeholder:text-gray-400 focus:ring-3"
                  prefix={
                    <EnvelopeIcon
                      className="size-5 transition-colors duration-200"
                      strokeWidth="1"
                    />
                  }
                  {...register("username")}
                  error={errors?.username?.message}
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
                  {...register("password")}
                  error={errors?.password?.message}
                />
                <div className="mt-2">
                  <InputErrorMsg
                    when={(errorMessage && errorMessage !== "") as boolean}
                  >
                    {errorMessage}
                  </InputErrorMsg>
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Checkbox label="Recordarme" />
                  <a
                    href="##"
                    className="dark:text-dark-300 dark:hover:text-dark-100 dark:focus:text-dark-100 text-xs text-gray-400 transition-colors hover:text-gray-800 focus:text-gray-800"
                  >
                    Olvidé mi contraseña
                  </a>
                </div>
              </div>
              <Button
                type="submit"
                color="primary"
                className="mt-10 h-10 w-full"
              >
                Iniciar sesión
              </Button>
            </form>
            <Link to="/sign-up" className="w-full">
              <Button
                type="button"
                color="primary"
                variant="outlined"
                className="mt-4 h-10 w-full"
              >
                Registrarse
              </Button>
            </Link>
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
