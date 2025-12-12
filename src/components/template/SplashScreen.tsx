// Local Imports
import logoImage from "@/assets/Recurso-1CEC-bco.png";
import { Progress } from "@/components/ui";

// ----------------------------------------------------------------------

export function SplashScreen() {
  return (
    <>
      <div className="fixed grid h-full w-full place-content-center">
        <img src={logoImage} alt="CEC Logo" className="size-28" />
        <Progress
          color="primary"
          isIndeterminate
          animationDuration="1s"
          className="mt-2 h-1"
        />
      </div>
    </>
  );
}
