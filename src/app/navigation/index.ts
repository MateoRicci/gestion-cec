import { dashboards } from "./segments/dashboards";

export const navigation = [
  dashboards,
];

// Re-export para facilitar el uso
export { useFilteredNavigation } from "@/hooks/useFilteredNavigation";
