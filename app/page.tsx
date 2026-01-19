import { getItems } from "@/app/actions/items";
import { getExpenses } from "@/app/actions/expenses";
import Dashboard from "@/app/components/Dashboard";

// Forzar renderizado dinámico (no pre-renderizar en build time)
export const dynamic = "force-dynamic";

export default async function Page() {
  // Cargar datos desde la base de datos
  const [items, expenses] = await Promise.all([getItems(), getExpenses()]);

  return <Dashboard initialItems={items} initialExpenses={expenses} />;
}
