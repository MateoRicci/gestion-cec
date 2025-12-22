// Import Dependencies
import { useState } from "react";
import { Page } from "@/components/shared/Page";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import clsx from "clsx";
import { ConveniosTab } from "./components/ConveniosTab";
import { ImportarPadronTab } from "./components/ImportarPadronTab";
import { HistorialImportacionesTab } from "./components/HistorialImportacionesTab";

// ----------------------------------------------------------------------

export default function ConveniosConfig() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Page title="Configuración de Convenios">
      <div className="flex w-full flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-dark-50">
            Convenios
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-200">
            Gestiona los tipos de convenios y importa padrones de afiliados
          </p>
        </div>

        {/* Tabs */}
        <TabGroup selectedIndex={activeTab} onChange={setActiveTab}>
          <TabList className="flex gap-1 border-b border-gray-200 dark:border-dark-600">
            <Tab
              className={({ selected }: { selected: boolean }) =>
                clsx(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "border-b-2 border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-dark-300 dark:hover:text-dark-100",
                )
              }
            >
              Convenios
            </Tab>
            <Tab
              className={({ selected }: { selected: boolean }) =>
                clsx(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "border-b-2 border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-dark-300 dark:hover:text-dark-100",
                )
              }
            >
              Importar Padrón
            </Tab>
            <Tab
              className={({ selected }: { selected: boolean }) =>
                clsx(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "border-b-2 border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-dark-300 dark:hover:text-dark-100",
                )
              }
            >
              Historial de Importaciones
            </Tab>
          </TabList>

          <TabPanels className="mt-6">
            <TabPanel>
              <ConveniosTab />
            </TabPanel>
            <TabPanel>
              <ImportarPadronTab />
            </TabPanel>
            <TabPanel>
              <HistorialImportacionesTab />
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </Page>
  );
}
