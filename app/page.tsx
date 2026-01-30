import { getItems } from "@/app/actions/items";
import { getExpenses } from "@/app/actions/expenses";
import { getVolcanitaCalculations } from "@/app/actions/volcanita";
import { getInsulationCalculations } from "./actions/insulation";
import Dashboard from "@/app/components/Dashboard";

// Forzar renderizado dinámico (no pre-renderizar en build time)
export const dynamic = "force-dynamic";

export default async function Page() {
  // Cargar datos desde la base de datos
  const [items, expenses, volcanitaCalculations, insulationCalculations] =
    await Promise.all([
      getItems(),
      getExpenses(),
      getVolcanitaCalculations(),
      getInsulationCalculations(),
    ]);

  return (
    <Dashboard
      initialItems={items}
      initialExpenses={expenses}
      initialVolcanitaCalculations={volcanitaCalculations}
      initialInsulationCalculations={insulationCalculations}
    />
  );
}
