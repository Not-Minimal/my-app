"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  Home,
  Users,
  PiggyBank,
  TrendingUp,
  Plus,
  ChefHat,
  Sofa,
  UtensilsCrossed,
  Bath,
  BedDouble,
  Bed,
  DoorOpen,
  Move,
  X,
  Check,
  Building2,
  Ruler,
  LandPlot,
  Layers,
  CircleDollarSign,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Link as LinkIcon,
  Package,
  Hash,
  Edit3,
  Save,
  Search,
  Loader2,
} from "lucide-react";

import {
  type Item as DBItem,
  type Expense as DBExpense,
} from "@/app/db/schema";

import {
  createItem,
  updateItem,
  deleteItem as deleteItemAction,
} from "@/app/actions/items";

import {
  createExpense,
  updateExpenseQuantity as updateExpenseQuantityAction,
  toggleExpensePaid,
  deleteExpense as deleteExpenseAction,
} from "@/app/actions/expenses";

import {
  type Room,
  type ExpenseCategory,
  type Floor,
  projectInfo,
  contributors,
  roomsConfig,
  categoriesConfig,
  formatCurrency,
  getTotalBudget,
  getHouseArea,
} from "@/app/data/project-data";

// Mapeo de iconos para los ambientes
const roomIcons: Record<string, React.ReactNode> = {
  cocina: <ChefHat size={18} />,
  living: <Sofa size={18} />,
  comedor: <UtensilsCrossed size={18} />,
  bano: <Bath size={18} />,
  "pieza-grande": <BedDouble size={18} />,
  "pieza-mediana": <Bed size={18} />,
  "pieza-pequena": <DoorOpen size={18} />,
  pasillo: <Move size={18} />,
  general: <Home size={18} />,
};

// Funciones de cálculo locales
const getExpenseAmount = (expense: DBExpense, items: DBItem[]): number => {
  const item = items.find((i) => i.id === expense.itemId);
  return item ? item.unitPrice * expense.quantity : 0;
};

const getTotalExpenses = (expenses: DBExpense[], items: DBItem[]): number => {
  return expenses.reduce((sum, e) => sum + getExpenseAmount(e, items), 0);
};

const getTotalPaid = (expenses: DBExpense[], items: DBItem[]): number => {
  return expenses
    .filter((e) => e.paid)
    .reduce((sum, e) => sum + getExpenseAmount(e, items), 0);
};

const getFloorTotal = (
  expenses: DBExpense[],
  items: DBItem[],
  floor: number,
): number => {
  return expenses
    .filter((e) => e.floor === floor)
    .reduce((sum, e) => sum + getExpenseAmount(e, items), 0);
};

const getRoomTotal = (
  expenses: DBExpense[],
  items: DBItem[],
  room: string,
): number => {
  return expenses
    .filter((e) => e.room === room)
    .reduce((sum, e) => sum + getExpenseAmount(e, items), 0);
};

const getCategoryTotal = (
  expenses: DBExpense[],
  items: DBItem[],
  category: string,
): number => {
  return expenses
    .filter((e) => {
      const item = items.find((i) => i.id === e.itemId);
      return item?.category === category;
    })
    .reduce((sum, e) => sum + getExpenseAmount(e, items), 0);
};

const getContributorPaid = (
  expenses: DBExpense[],
  items: DBItem[],
  contributorId: string,
): number => {
  return expenses
    .filter((e) => e.paid && e.paidBy === contributorId)
    .reduce((sum, e) => sum + getExpenseAmount(e, items), 0);
};

interface DashboardProps {
  initialItems: DBItem[];
  initialExpenses: DBExpense[];
}

export default function Dashboard({
  initialItems,
  initialExpenses,
}: DashboardProps) {
  const [isPending, startTransition] = useTransition();

  // Estados principales (optimistic updates)
  const [items, setItems] = useState<DBItem[]>(initialItems);
  const [expenses, setExpenses] = useState<DBExpense[]>(initialExpenses);

  // Estados de UI
  const [activeTab, setActiveTab] = useState<
    "overview" | "expenses" | "items" | "rooms"
  >("overview");

  // Filtros para gastos
  const [filterRoom, setFilterRoom] = useState<Room | "all">("all");
  const [filterFloor, setFilterFloor] = useState<Floor | "all">("all");
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | "all">(
    "all",
  );

  // Modales
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DBItem | null>(null);

  // Búsqueda de items
  const [itemSearch, setItemSearch] = useState("");

  // Nuevo item
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    unitPrice: 0,
    category: "materiales" as ExpenseCategory,
    link: "",
    localPrice: 0,
    localDescription: "",
    notes: "",
  });

  // Nuevo gasto
  const [newExpense, setNewExpense] = useState({
    itemId: 0,
    quantity: 1,
    room: "general" as Room,
    floor: 0 as Floor,
    date: new Date().toISOString().split("T")[0],
    paid: false,
    paidBy: "",
    notes: "",
  });

  // Cálculos del presupuesto
  const totalBudget = getTotalBudget();
  const totalExpensesAmount = useMemo(
    () => getTotalExpenses(expenses, items),
    [expenses, items],
  );
  const totalPaid = useMemo(
    () => getTotalPaid(expenses, items),
    [expenses, items],
  );
  const remaining = totalBudget - totalExpensesAmount;
  const usedPercentage = (totalExpensesAmount / totalBudget) * 100;

  // Gastos filtrados
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const item = items.find((i) => i.id === e.itemId);
      if (filterRoom !== "all" && e.room !== filterRoom) return false;
      if (filterFloor !== "all" && e.floor !== filterFloor) return false;
      if (filterCategory !== "all" && item?.category !== filterCategory)
        return false;
      return true;
    });
  }, [expenses, items, filterRoom, filterFloor, filterCategory]);

  // Items filtrados por búsqueda
  const filteredItems = useMemo(() => {
    if (!itemSearch) return items;
    const search = itemSearch.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        categoriesConfig[item.category as ExpenseCategory]?.name
          .toLowerCase()
          .includes(search),
    );
  }, [items, itemSearch]);

  // Total de unidades en gastos
  const totalUnits = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.quantity, 0);
  }, [expenses]);

  // ============ CRUD Items ============

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.unitPrice) return;

    startTransition(async () => {
      try {
        const created = await createItem({
          name: newItem.name,
          description: newItem.description || undefined,
          unitPrice: newItem.unitPrice,
          category: newItem.category,
          link: newItem.link || undefined,
          localPrice: newItem.localPrice || undefined,
          localDescription: newItem.localDescription || undefined,
          notes: newItem.notes || undefined,
        });

        setItems([...items, created]);
        setNewItem({
          name: "",
          description: "",
          unitPrice: 0,
          category: "materiales",
          link: "",
          localPrice: 0,
          localDescription: "",
          notes: "",
        });
        setShowAddItemModal(false);
      } catch (error) {
        console.error("Error creating item:", error);
        alert("Error al crear el producto");
      }
    });
  };

  const handleEditItem = async () => {
    if (!editingItem) return;

    startTransition(async () => {
      try {
        const updated = await updateItem(editingItem.id, {
          name: editingItem.name,
          description: editingItem.description || undefined,
          unitPrice: editingItem.unitPrice,
          category: editingItem.category,
          link: editingItem.link || undefined,
          localPrice: editingItem.localPrice,
          localDescription: editingItem.localDescription,
          notes: editingItem.notes || undefined,
        });

        setItems(items.map((i) => (i.id === updated.id ? updated : i)));
        setEditingItem(null);
        setShowEditItemModal(false);
      } catch (error) {
        console.error("Error updating item:", error);
        alert("Error al actualizar el producto");
      }
    });
  };

  const handleDeleteItem = async (id: number) => {
    const hasExpenses = expenses.some((e) => e.itemId === id);
    if (hasExpenses) {
      alert(
        "No puedes eliminar este item porque hay gastos asociados. Elimina los gastos primero.",
      );
      return;
    }

    startTransition(async () => {
      try {
        await deleteItemAction(id);
        setItems(items.filter((i) => i.id !== id));
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Error al eliminar el producto");
      }
    });
  };

  const openEditItem = (item: DBItem) => {
    setEditingItem({ ...item });
    setShowEditItemModal(true);
  };

  // ============ CRUD Expenses ============

  const handleAddExpense = async () => {
    if (!newExpense.itemId || !newExpense.quantity) return;

    startTransition(async () => {
      try {
        const created = await createExpense({
          itemId: newExpense.itemId,
          quantity: newExpense.quantity,
          room: newExpense.room,
          floor: newExpense.floor,
          date: newExpense.date,
          paid: newExpense.paid,
          paidBy: newExpense.paidBy || undefined,
          notes: newExpense.notes || undefined,
        });

        setExpenses([...expenses, created]);
        setNewExpense({
          itemId: 0,
          quantity: 1,
          room: "general",
          floor: 0,
          date: new Date().toISOString().split("T")[0],
          paid: false,
          paidBy: "",
          notes: "",
        });
        setShowAddExpenseModal(false);
      } catch (error) {
        console.error("Error creating expense:", error);
        alert("Error al crear el gasto");
      }
    });
  };

  const handleTogglePaid = async (id: number, paidBy?: string) => {
    startTransition(async () => {
      try {
        const updated = await toggleExpensePaid(id, paidBy);
        setExpenses(expenses.map((e) => (e.id === updated.id ? updated : e)));
      } catch (error) {
        console.error("Error toggling paid:", error);
        alert("Error al actualizar el estado de pago");
      }
    });
  };

  const handleDeleteExpense = async (id: number) => {
    startTransition(async () => {
      try {
        await deleteExpenseAction(id);
        setExpenses(expenses.filter((e) => e.id !== id));
      } catch (error) {
        console.error("Error deleting expense:", error);
        alert("Error al eliminar el gasto");
      }
    });
  };

  const handleUpdateQuantity = async (id: number, quantity: number) => {
    if (quantity < 1) return;

    // Optimistic update
    setExpenses(expenses.map((e) => (e.id === id ? { ...e, quantity } : e)));

    startTransition(async () => {
      try {
        await updateExpenseQuantityAction(id, quantity);
      } catch (error) {
        console.error("Error updating quantity:", error);
        // Revertir en caso de error
        const original = expenses.find((e) => e.id === id);
        if (original) {
          setExpenses(expenses);
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-4 md:p-6 lg:p-8 font-sans">
      {/* Loading overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 shadow-lg flex items-center gap-3">
            <Loader2 className="animate-spin text-blue-500" size={24} />
            <span className="text-slate-700">Guardando...</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30">
                <Home size={28} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                  {projectInfo.name}
                </h1>
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <Building2 size={14} />
                  {projectInfo.type} • {projectInfo.house.floors} Pisos
                </p>
              </div>
            </div>

            {/* Info del proyecto */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                <Ruler size={16} className="text-blue-500" />
                <div className="text-xs">
                  <p className="text-slate-400">Casa</p>
                  <p className="font-semibold text-slate-700">
                    {projectInfo.house.width}m × {projectInfo.house.length}m
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                <LandPlot size={16} className="text-green-500" />
                <div className="text-xs">
                  <p className="text-slate-400">Terreno</p>
                  <p className="font-semibold text-slate-700">
                    {projectInfo.land.width}m × {projectInfo.land.length}m
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                <Layers size={16} className="text-purple-500" />
                <div className="text-xs">
                  <p className="text-slate-400">Área Total Casa</p>
                  <p className="font-semibold text-slate-700">
                    {getHouseArea()} m²
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navegación por tabs */}
        <nav className="bg-white rounded-xl shadow-sm border border-slate-200 p-1.5 flex gap-1">
          {[
            { id: "overview", label: "Resumen", icon: <PiggyBank size={16} /> },
            { id: "items", label: "Catálogo", icon: <Package size={16} /> },
            { id: "expenses", label: "Gastos", icon: <Receipt size={16} /> },
            { id: "rooms", label: "Ambientes", icon: <Home size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* ==================== TAB: RESUMEN ==================== */}
        {activeTab === "overview" && (
          <>
            {/* Cards de Presupuesto */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <PiggyBank size={20} className="text-blue-500" />
                  </div>
                  <span className="text-xs font-medium text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                    Total
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-slate-800">
                  {formatCurrency(totalBudget)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Presupuesto disponible
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <TrendingUp size={20} className="text-orange-500" />
                  </div>
                  <span className="text-xs font-medium text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                    {usedPercentage.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-slate-800">
                  {formatCurrency(totalExpensesAmount)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Total comprometido
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CheckCircle2 size={20} className="text-green-500" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatCurrency(totalPaid)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Ya pagado</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <CircleDollarSign size={20} className="text-emerald-500" />
                  </div>
                </div>
                <p
                  className={`text-xl sm:text-2xl font-bold ${remaining >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {formatCurrency(remaining)}
                </p>
                <p className="text-xs text-slate-400 mt-1">Disponible</p>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700">
                  Uso del Presupuesto
                </h3>
                <span
                  className={`text-sm font-bold ${usedPercentage > 100 ? "text-red-500" : usedPercentage > 80 ? "text-orange-500" : "text-green-500"}`}
                >
                  {usedPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${usedPercentage > 100 ? "bg-red-500" : usedPercentage > 80 ? "bg-orange-500" : "bg-gradient-to-r from-green-400 to-emerald-500"}`}
                  style={{ width: `${Math.min(usedPercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-400">
                <span>0</span>
                <span>{formatCurrency(totalBudget)}</span>
              </div>
            </div>

            {/* Contribuyentes */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={20} className="text-slate-600" />
                <h3 className="font-semibold text-slate-700">Contribuyentes</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contributors.map((contributor) => {
                  const paid = getContributorPaid(
                    expenses,
                    items,
                    contributor.id,
                  );
                  const percentage =
                    (contributor.contribution / totalBudget) * 100;
                  return (
                    <div
                      key={contributor.id}
                      className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${contributor.id === "jessenia" ? "bg-gradient-to-br from-pink-400 to-pink-500" : "bg-gradient-to-br from-blue-400 to-blue-500"}`}
                          >
                            {contributor.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-700">
                              {contributor.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {percentage.toFixed(0)}% del total
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Aporte:</span>
                          <span className="font-semibold text-slate-700">
                            {formatCurrency(contributor.contribution)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Pagado:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(paid)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumen por Piso */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Home size={20} className="text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700">
                      General / Estructura
                    </h4>
                    <p className="text-xs text-slate-400">Gastos globales</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-800">
                  {formatCurrency(getFloorTotal(expenses, items, 0))}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Layers size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700">
                      Primer Piso
                    </h4>
                    <p className="text-xs text-slate-400">
                      Cocina, Living, Comedor, Baño
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-800">
                  {formatCurrency(getFloorTotal(expenses, items, 1))}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Layers size={20} className="text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700">
                      Segundo Piso
                    </h4>
                    <p className="text-xs text-slate-400">3 Piezas, Pasillo</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-800">
                  {formatCurrency(getFloorTotal(expenses, items, 2))}
                </p>
              </div>
            </div>

            {/* Resumen por Categoría */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <h3 className="font-semibold text-slate-700 mb-4">
                Gastos por Categoría
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.keys(categoriesConfig) as ExpenseCategory[]).map(
                  (cat) => {
                    const total = getCategoryTotal(expenses, items, cat);
                    if (total === 0) return null;
                    return (
                      <div key={cat} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`w-2 h-2 rounded-full ${categoriesConfig[cat].color}`}
                          />
                          <span className="text-xs font-medium text-slate-600">
                            {categoriesConfig[cat].name}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-slate-800">
                          {formatCurrency(total)}
                        </p>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </>
        )}

        {/* ==================== TAB: CATÁLOGO DE ITEMS ==================== */}
        {activeTab === "items" && (
          <>
            {/* Barra de búsqueda y agregar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Buscar productos..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => setShowAddItemModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus size={18} />
                  Nuevo Producto
                </button>
              </div>
            </div>

            {/* Resumen del catálogo */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package size={18} className="text-blue-500" />
                  <span className="text-sm font-medium text-slate-600">
                    Productos en Catálogo
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  {items.length}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt size={18} className="text-purple-500" />
                  <span className="text-sm font-medium text-slate-600">
                    En uso (Gastos)
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  {new Set(expenses.map((e) => e.itemId)).size}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <LinkIcon size={18} className="text-green-500" />
                  <span className="text-sm font-medium text-slate-600">
                    Con Link
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-800">
                  {items.filter((i) => i.link).length}
                </p>
              </div>
            </div>

            {/* Lista de items */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Package size={18} />
                  <h3 className="font-semibold">Catálogo de Productos</h3>
                </div>
                <span className="text-sm bg-slate-700 px-3 py-1 rounded-full">
                  {filteredItems.length} productos
                </span>
              </div>

              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
                  <p>No hay productos en el catálogo</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const usageCount = expenses.filter(
                      (e) => e.itemId === item.id,
                    ).length;
                    const category = item.category as ExpenseCategory;
                    return (
                      <div
                        key={item.id}
                        className="p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 rounded-lg ${categoriesConfig[category]?.color || "bg-slate-500"} text-white`}
                              >
                                <Package size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800">
                                  {item.name}
                                </p>
                                {item.description && (
                                  <p className="text-sm text-slate-500 mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full text-white ${categoriesConfig[category]?.color || "bg-slate-500"}`}
                                  >
                                    {categoriesConfig[category]?.name ||
                                      category}
                                  </span>
                                  {usageCount > 0 && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                      Usado en {usageCount} gasto
                                      {usageCount > 1 ? "s" : ""}
                                    </span>
                                  )}
                                  {item.link && (
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1 hover:bg-green-200 transition-colors"
                                    >
                                      <ExternalLink size={10} />
                                      Ver producto
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Comparación de precios */}
                            <div className="flex gap-3">
                              {/* Precio Internet */}
                              <div className="text-right">
                                <p className="text-xs text-blue-500 flex items-center justify-end gap-1">
                                  🌐 Internet
                                </p>
                                <p className="text-lg font-bold text-slate-800">
                                  {formatCurrency(item.unitPrice)}
                                </p>
                              </div>

                              {/* Precio Local Cañete */}
                              {item.localPrice ? (
                                <div className="text-right border-l border-slate-200 pl-3">
                                  <p className="text-xs text-green-600 flex items-center justify-end gap-1">
                                    🏪 Cañete
                                  </p>
                                  <p className="text-lg font-bold text-slate-800">
                                    {formatCurrency(item.localPrice)}
                                  </p>
                                  {item.localDescription && (
                                    <p className="text-xs text-slate-400 max-w-[120px] truncate">
                                      {item.localDescription}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="text-right border-l border-slate-200 pl-3">
                                  <p className="text-xs text-slate-400">
                                    🏪 Cañete
                                  </p>
                                  <p className="text-sm text-slate-400 italic">
                                    Sin precio
                                  </p>
                                </div>
                              )}

                              {/* Indicador de mejor precio */}
                              {item.localPrice && (
                                <div className="flex items-center">
                                  {item.localPrice < item.unitPrice ? (
                                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium whitespace-nowrap">
                                      ✓ Cañete -
                                      {formatCurrency(
                                        item.unitPrice - item.localPrice,
                                      )}
                                    </span>
                                  ) : item.localPrice > item.unitPrice ? (
                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium whitespace-nowrap">
                                      ✓ Internet -
                                      {formatCurrency(
                                        item.localPrice - item.unitPrice,
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                                      = Igual
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => openEditItem(item)}
                                className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                                title="Editar"
                              >
                                <Edit3 size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {item.notes && (
                          <div className="mt-3 ml-12 p-2 bg-amber-50 rounded-lg text-sm text-amber-700">
                            📝 {item.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ==================== TAB: GASTOS ==================== */}
        {activeTab === "expenses" && (
          <>
            {/* Filtros y acciones */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="flex flex-wrap gap-2">
                  <select
                    value={filterRoom}
                    onChange={(e) =>
                      setFilterRoom(e.target.value as Room | "all")
                    }
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos los ambientes</option>
                    {(Object.keys(roomsConfig) as Room[]).map((room) => (
                      <option key={room} value={room}>
                        {roomsConfig[room].name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterFloor === "all" ? "all" : filterFloor}
                    onChange={(e) =>
                      setFilterFloor(
                        e.target.value === "all"
                          ? "all"
                          : (Number(e.target.value) as Floor),
                      )
                    }
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos los pisos</option>
                    <option value="0">General</option>
                    <option value="1">Piso 1</option>
                    <option value="2">Piso 2</option>
                  </select>
                  <select
                    value={filterCategory}
                    onChange={(e) =>
                      setFilterCategory(
                        e.target.value as ExpenseCategory | "all",
                      )
                    }
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todas las categorías</option>
                    {(Object.keys(categoriesConfig) as ExpenseCategory[]).map(
                      (cat) => (
                        <option key={cat} value={cat}>
                          {categoriesConfig[cat].name}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus size={18} />
                  Agregar Gasto
                </button>
              </div>
            </div>

            {/* Resumen rápido */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Total Gastos</p>
                <p className="text-xl font-bold text-slate-800">
                  {expenses.length}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Unidades Totales</p>
                <p className="text-xl font-bold text-slate-800">{totalUnits}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Monto Total</p>
                <p className="text-xl font-bold text-slate-800">
                  {formatCurrency(totalExpensesAmount)}
                </p>
              </div>
            </div>

            {/* Lista de gastos */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Receipt size={18} />
                  <h3 className="font-semibold">Lista de Gastos</h3>
                </div>
                <span className="text-sm bg-slate-700 px-3 py-1 rounded-full">
                  {filteredExpenses.length} gastos
                </span>
              </div>

              {filteredExpenses.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
                  <p>No hay gastos que mostrar</p>
                  <button
                    onClick={() => setShowAddExpenseModal(true)}
                    className="mt-4 text-blue-500 hover:text-blue-600 text-sm font-medium"
                  >
                    + Agregar primer gasto
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredExpenses.map((expense) => {
                    const item = items.find((i) => i.id === expense.itemId);
                    if (!item) return null;
                    const amount = getExpenseAmount(expense, items);
                    const category = item.category as ExpenseCategory;

                    return (
                      <div
                        key={expense.id}
                        className="p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div
                              className={`p-2 rounded-lg ${expense.paid ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-600"}`}
                            >
                              {roomIcons[expense.room] || <Home size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800">
                                {item.name}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                  <Hash size={12} />
                                  {expense.quantity}{" "}
                                  {expense.quantity === 1
                                    ? "unidad"
                                    : "unidades"}
                                </span>
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                                  {roomsConfig[expense.room as Room]?.name ||
                                    expense.room}
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full text-white ${categoriesConfig[category]?.color || "bg-slate-500"}`}
                                >
                                  {categoriesConfig[category]?.name || category}
                                </span>
                                {expense.paid && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                                    <CheckCircle2 size={12} />
                                    Pagado
                                    {expense.paidBy &&
                                      ` por ${contributors.find((c) => c.id === expense.paidBy)?.name}`}
                                  </span>
                                )}
                                {item.link && (
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-blue-100 transition-colors"
                                  >
                                    <ExternalLink size={10} />
                                    Ver
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Control de cantidad */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    expense.id,
                                    expense.quantity - 1,
                                  )
                                }
                                className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                                disabled={expense.quantity <= 1}
                              >
                                -
                              </button>
                              <span className="w-12 text-center font-semibold text-slate-700">
                                {expense.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    expense.id,
                                    expense.quantity + 1,
                                  )
                                }
                                className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                              >
                                +
                              </button>
                            </div>

                            <div className="text-right min-w-[100px]">
                              <p className="text-xs text-slate-400">
                                {formatCurrency(item.unitPrice)} c/u
                              </p>
                              <p className="text-lg font-bold text-slate-800">
                                {formatCurrency(amount)}
                              </p>
                            </div>

                            <div className="flex gap-1">
                              {!expense.paid && (
                                <div className="relative group">
                                  <button
                                    className="p-2 hover:bg-green-50 rounded-lg text-slate-400 hover:text-green-500 transition-colors"
                                    title="Marcar como pagado"
                                  >
                                    <Check size={18} />
                                  </button>
                                  <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border border-slate-200 p-2 hidden group-hover:block z-10 min-w-[120px]">
                                    <p className="text-xs text-slate-400 mb-2">
                                      Pagado por:
                                    </p>
                                    {contributors.map((c) => (
                                      <button
                                        key={c.id}
                                        onClick={() =>
                                          handleTogglePaid(expense.id, c.id)
                                        }
                                        className="w-full text-left px-2 py-1.5 text-sm hover:bg-slate-50 rounded"
                                      >
                                        {c.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {expense.paid && (
                                <button
                                  onClick={() => handleTogglePaid(expense.id)}
                                  className="p-2 hover:bg-orange-50 rounded-lg text-green-500 hover:text-orange-500 transition-colors"
                                  title="Desmarcar como pagado"
                                >
                                  <X size={18} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {expense.notes && (
                          <div className="mt-3 ml-12 p-2 bg-amber-50 rounded-lg text-sm text-amber-700">
                            📝 {expense.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total */}
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">
                  {formatCurrency(
                    filteredExpenses.reduce(
                      (sum, e) => sum + getExpenseAmount(e, items),
                      0,
                    ),
                  )}
                </span>
              </div>
            </div>
          </>
        )}

        {/* ==================== TAB: AMBIENTES ==================== */}
        {activeTab === "rooms" && (
          <>
            {/* Piso 1 */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <Layers size={20} className="text-blue-500" />
                Primer Piso
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.keys(roomsConfig) as Room[])
                  .filter((room) => roomsConfig[room].floor === 1)
                  .map((room) => {
                    const roomExpenses = expenses.filter(
                      (e) => e.room === room,
                    );
                    const total = getRoomTotal(expenses, items, room);
                    return (
                      <div
                        key={room}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-500">
                            {roomIcons[room]}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-700">
                              {roomsConfig[room].name}
                            </h4>
                            <p className="text-xs text-slate-400">
                              {roomExpenses.length} gastos
                            </p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">
                          {formatCurrency(total)}
                        </p>

                        {/* Lista de items con cantidades */}
                        {roomExpenses.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-500 mb-2 font-medium">
                              Items:
                            </p>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {roomExpenses.map((expense) => {
                                const item = items.find(
                                  (i) => i.id === expense.itemId,
                                );
                                return (
                                  <div
                                    key={expense.id}
                                    className="flex justify-between text-xs"
                                  >
                                    <span className="text-slate-600 truncate flex-1 mr-2">
                                      {item?.name || "Item desconocido"}
                                    </span>
                                    <span className="text-slate-800 font-medium whitespace-nowrap">
                                      x{expense.quantity}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Pagado</span>
                            <span className="text-green-600 font-medium">
                              {formatCurrency(
                                roomExpenses
                                  .filter((e) => e.paid)
                                  .reduce(
                                    (s, e) => s + getExpenseAmount(e, items),
                                    0,
                                  ),
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span className="text-slate-400">Pendiente</span>
                            <span className="text-orange-600 font-medium">
                              {formatCurrency(
                                roomExpenses
                                  .filter((e) => !e.paid)
                                  .reduce(
                                    (s, e) => s + getExpenseAmount(e, items),
                                    0,
                                  ),
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Piso 2 */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <Layers size={20} className="text-purple-500" />
                Segundo Piso
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.keys(roomsConfig) as Room[])
                  .filter((room) => roomsConfig[room].floor === 2)
                  .map((room) => {
                    const roomExpenses = expenses.filter(
                      (e) => e.room === room,
                    );
                    const total = getRoomTotal(expenses, items, room);
                    return (
                      <div
                        key={room}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2.5 bg-purple-50 rounded-xl text-purple-500">
                            {roomIcons[room]}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-700">
                              {roomsConfig[room].name}
                            </h4>
                            <p className="text-xs text-slate-400">
                              {roomExpenses.length} gastos
                            </p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">
                          {formatCurrency(total)}
                        </p>

                        {/* Lista de items con cantidades */}
                        {roomExpenses.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-500 mb-2 font-medium">
                              Items:
                            </p>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {roomExpenses.map((expense) => {
                                const item = items.find(
                                  (i) => i.id === expense.itemId,
                                );
                                return (
                                  <div
                                    key={expense.id}
                                    className="flex justify-between text-xs"
                                  >
                                    <span className="text-slate-600 truncate flex-1 mr-2">
                                      {item?.name || "Item desconocido"}
                                    </span>
                                    <span className="text-slate-800 font-medium whitespace-nowrap">
                                      x{expense.quantity}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Pagado</span>
                            <span className="text-green-600 font-medium">
                              {formatCurrency(
                                roomExpenses
                                  .filter((e) => e.paid)
                                  .reduce(
                                    (s, e) => s + getExpenseAmount(e, items),
                                    0,
                                  ),
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span className="text-slate-400">Pendiente</span>
                            <span className="text-orange-600 font-medium">
                              {formatCurrency(
                                roomExpenses
                                  .filter((e) => !e.paid)
                                  .reduce(
                                    (s, e) => s + getExpenseAmount(e, items),
                                    0,
                                  ),
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* General */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <Home size={20} className="text-slate-500" />
                General / Estructura
              </h3>
              {(() => {
                const generalExpenses = expenses.filter(
                  (e) => e.room === "general",
                );
                return (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500">
                          <Home size={18} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-700">
                            Gastos Generales
                          </h4>
                          <p className="text-xs text-slate-400">
                            {generalExpenses.length} gastos
                          </p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-slate-800">
                        {formatCurrency(
                          getRoomTotal(expenses, items, "general"),
                        )}
                      </p>
                    </div>

                    {/* Lista de items con cantidades */}
                    {generalExpenses.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-2 font-medium">
                          Items:
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {generalExpenses.map((expense) => {
                            const item = items.find(
                              (i) => i.id === expense.itemId,
                            );
                            return (
                              <div
                                key={expense.id}
                                className="flex justify-between text-xs bg-slate-50 rounded-lg px-2 py-1"
                              >
                                <span className="text-slate-600 truncate flex-1 mr-2">
                                  {item?.name || "Item desconocido"}
                                </span>
                                <span className="text-slate-800 font-medium whitespace-nowrap">
                                  x{expense.quantity}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </>
        )}

        {/* ==================== MODAL: NUEVO ITEM ==================== */}
        {showAddItemModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">
                  Nuevo Producto
                </h3>
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre del producto *
                  </label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Volcanita 10mm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <input
                    type="text"
                    value={newItem.description}
                    onChange={(e) =>
                      setNewItem({ ...newItem, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Detalles adicionales"
                  />
                </div>

                {/* Sección de Precio Internet */}
                <div className="bg-blue-50 rounded-lg p-3 space-y-3">
                  <p className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                    🌐 Precio Internet
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Precio Unitario *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        value={newItem.unitPrice || ""}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            unitPrice: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección de Precio Local Cañete */}
                <div className="bg-green-50 rounded-lg p-3 space-y-3">
                  <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
                    🏪 Precio Local (Cañete)
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Precio Local (opcional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        value={newItem.localPrice || ""}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            localPrice: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tienda/Descripción Local (opcional)
                    </label>
                    <input
                      type="text"
                      value={newItem.localDescription}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          localDescription: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Ej: Ferretería Don Juan, Sodimac Cañete"
                    />
                  </div>
                </div>

                {/* Comparación de precios */}
                {newItem.unitPrice > 0 && newItem.localPrice > 0 && (
                  <div className="bg-slate-100 rounded-lg p-3">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      📊 Comparación
                    </p>
                    <div className="flex justify-between text-sm">
                      <span>Diferencia:</span>
                      <span
                        className={`font-bold ${
                          newItem.localPrice < newItem.unitPrice
                            ? "text-green-600"
                            : newItem.localPrice > newItem.unitPrice
                              ? "text-red-600"
                              : "text-slate-600"
                        }`}
                      >
                        {newItem.localPrice < newItem.unitPrice
                          ? `Cañete es ${formatCurrency(newItem.unitPrice - newItem.localPrice)} más barato`
                          : newItem.localPrice > newItem.unitPrice
                            ? `Internet es ${formatCurrency(newItem.localPrice - newItem.unitPrice)} más barato`
                            : "Mismo precio"}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        category: e.target.value as ExpenseCategory,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(Object.keys(categoriesConfig) as ExpenseCategory[]).map(
                      (cat) => (
                        <option key={cat} value={cat}>
                          {categoriesConfig[cat].name}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Link del producto Internet (opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <LinkIcon size={16} />
                    </span>
                    <input
                      type="url"
                      value={newItem.link}
                      onChange={(e) =>
                        setNewItem({ ...newItem, link: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={newItem.notes}
                    onChange={(e) =>
                      setNewItem({ ...newItem, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={!newItem.name || !newItem.unitPrice || isPending}
                  className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MODAL: EDITAR ITEM ==================== */}
        {showEditItemModal && editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">
                  Editar Producto
                </h3>
                <button
                  onClick={() => {
                    setShowEditItemModal(false);
                    setEditingItem(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre del producto *
                  </label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <input
                    type="text"
                    value={editingItem.description || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Sección de Precio Internet */}
                <div className="bg-blue-50 rounded-lg p-3 space-y-3">
                  <p className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                    🌐 Precio Internet
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Precio Unitario *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        value={editingItem.unitPrice}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            unitPrice: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección de Precio Local Cañete */}
                <div className="bg-green-50 rounded-lg p-3 space-y-3">
                  <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
                    🏪 Precio Local (Cañete)
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Precio Local (opcional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        value={editingItem.localPrice || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            localPrice: parseInt(e.target.value) || null,
                          })
                        }
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tienda/Descripción Local (opcional)
                    </label>
                    <input
                      type="text"
                      value={editingItem.localDescription || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          localDescription: e.target.value || null,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Ej: Ferretería Don Juan, Sodimac Cañete"
                    />
                  </div>
                </div>

                {/* Comparación de precios */}
                {editingItem.unitPrice > 0 &&
                  (editingItem.localPrice ?? 0) > 0 && (
                    <div className="bg-slate-100 rounded-lg p-3">
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        📊 Comparación
                      </p>
                      <div className="flex justify-between text-sm">
                        <span>Diferencia:</span>
                        <span
                          className={`font-bold ${
                            (editingItem.localPrice ?? 0) <
                            editingItem.unitPrice
                              ? "text-green-600"
                              : (editingItem.localPrice ?? 0) >
                                  editingItem.unitPrice
                                ? "text-red-600"
                                : "text-slate-600"
                          }`}
                        >
                          {(editingItem.localPrice ?? 0) < editingItem.unitPrice
                            ? `Cañete es ${formatCurrency(editingItem.unitPrice - (editingItem.localPrice ?? 0))} más barato`
                            : (editingItem.localPrice ?? 0) >
                                editingItem.unitPrice
                              ? `Internet es ${formatCurrency((editingItem.localPrice ?? 0) - editingItem.unitPrice)} más barato`
                              : "Mismo precio"}
                        </span>
                      </div>
                    </div>
                  )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={editingItem.category}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(Object.keys(categoriesConfig) as ExpenseCategory[]).map(
                      (cat) => (
                        <option key={cat} value={cat}>
                          {categoriesConfig[cat].name}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Link del producto Internet (opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <LinkIcon size={16} />
                    </span>
                    <input
                      type="url"
                      value={editingItem.link || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, link: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={editingItem.notes || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => {
                    setShowEditItemModal(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditItem}
                  disabled={
                    !editingItem.name || !editingItem.unitPrice || isPending
                  }
                  className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MODAL: NUEVO GASTO ==================== */}
        {showAddExpenseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">
                  Nuevo Gasto
                </h3>
                <button
                  onClick={() => setShowAddExpenseModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Seleccionar Item */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Producto del catálogo *
                  </label>
                  <select
                    value={newExpense.itemId || ""}
                    onChange={(e) => {
                      setNewExpense({
                        ...newExpense,
                        itemId: parseInt(e.target.value) || 0,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar producto...</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {formatCurrency(item.unitPrice)}
                      </option>
                    ))}
                  </select>
                  {items.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No hay productos en el catálogo.{" "}
                      <button
                        onClick={() => {
                          setShowAddExpenseModal(false);
                          setShowAddItemModal(true);
                        }}
                        className="text-blue-500 hover:underline"
                      >
                        Crear uno primero
                      </button>
                    </p>
                  )}
                </div>

                {/* Mostrar info del item seleccionado */}
                {newExpense.itemId > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    {(() => {
                      const selectedItem = items.find(
                        (i) => i.id === newExpense.itemId,
                      );
                      if (!selectedItem) return null;
                      const category = selectedItem.category as ExpenseCategory;
                      return (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-slate-700">
                              {selectedItem.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {categoriesConfig[category]?.name || category}
                            </p>
                          </div>
                          <p className="text-lg font-bold text-blue-600">
                            {formatCurrency(selectedItem.unitPrice)} c/u
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newExpense.quantity || ""}
                    onChange={(e) =>
                      setNewExpense({
                        ...newExpense,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1"
                  />
                </div>

                {/* Total estimado */}
                {newExpense.itemId > 0 && newExpense.quantity > 0 && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Total estimado:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(
                          (items.find((i) => i.id === newExpense.itemId)
                            ?.unitPrice || 0) * newExpense.quantity,
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Ambiente */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ambiente
                  </label>
                  <select
                    value={newExpense.room}
                    onChange={(e) => {
                      const room = e.target.value as Room;
                      setNewExpense({
                        ...newExpense,
                        room,
                        floor: roomsConfig[room].floor,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(Object.keys(roomsConfig) as Room[]).map((room) => (
                      <option key={room} value={room}>
                        {roomsConfig[room].name} (Piso{" "}
                        {roomsConfig[room].floor || "General"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Pagado */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="paid"
                    checked={newExpense.paid}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, paid: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="paid" className="text-sm text-slate-700">
                    Ya está pagado
                  </label>
                </div>

                {newExpense.paid && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Pagado por
                    </label>
                    <select
                      value={newExpense.paidBy || ""}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, paidBy: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      {contributors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={newExpense.notes || ""}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => setShowAddExpenseModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddExpense}
                  disabled={
                    !newExpense.itemId || !newExpense.quantity || isPending
                  }
                  className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Agregar Gasto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 py-4">
          <p>
            {projectInfo.name} • Dashboard de Control de Gastos •{" "}
            {projectInfo.house.width}m × {projectInfo.house.length}m •{" "}
            {getHouseArea()} m² totales
          </p>
        </footer>
      </div>
    </div>
  );
}
