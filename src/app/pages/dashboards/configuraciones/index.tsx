// Import Dependencies
import { Page } from "@/components/shared/Page";
import { Outlet } from "react-router";

// ----------------------------------------------------------------------

export default function Configuraciones() {
  return (
    <Page title="Configuraciones">
      <div className="transition-content flex w-full px-(--margin-x) pt-4 lg:pt-5">
        <div className="flex w-full">
          <Outlet />
        </div>
      </div>
    </Page>
  );
}

