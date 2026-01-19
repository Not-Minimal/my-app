// Tipos y datos del proyecto Casa Saul & Jessenia

export type Contributor = {
  id: string;
  name: string;
  contribution: number;
};

export type ExpenseCategory =
  | "materiales"
  | "muebles"
  | "decoracion"
  | "electrodomesticos"
  | "iluminacion"
  | "plomeria"
  | "electricidad"
  | "otros";

export type Room =
  // Primer Piso
  | "cocina"
  | "living"
  | "comedor"
  | "bano"
  // Segundo Piso
  | "pieza-grande"
  | "pieza-mediana"
  | "pieza-pequena"
  | "pasillo"
  // General
  | "general";

export type Floor = 1 | 2 | 0; // 0 para gastos generales

// Item del catálogo de productos
export type Item = {
  id: string;
  name: string;
  description?: string;
  unitPrice: number;
  category: ExpenseCategory;
  link?: string;
  notes?: string;
  createdAt: string;
};

// Gasto que referencia un item del catálogo
export type Expense = {
  id: string;
  itemId: string; // Referencia al item del catálogo
  quantity: number;
  room: Room;
  floor: Floor;
  date: string;
  paid: boolean;
  paidBy?: string; // ID del contribuyente
  notes?: string;
};

export type ProjectInfo = {
  name: string;
  type: string;
  house: {
    width: number;
    length: number;
    floors: number;
  };
  land: {
    width: number;
    length: number;
  };
};

// Datos iniciales del proyecto
export const projectInfo: ProjectInfo = {
  name: "Casa Saul & Jessenia",
  type: "Casa Prefabricada",
  house: {
    width: 5.5,
    length: 6.5,
    floors: 2,
  },
  land: {
    width: 8,
    length: 20,
  },
};

// Contribuyentes
export const contributors: Contributor[] = [
  { id: "jessenia", name: "Jessenia", contribution: 9000000 },
  { id: "saul", name: "Saul", contribution: 3000000 },
];

// Mapeo de ambientes
export const roomsConfig: Record<
  Room,
  { name: string; floor: Floor; icon: string }
> = {
  // Primer Piso
  cocina: { name: "Cocina", floor: 1, icon: "ChefHat" },
  living: { name: "Sala de Estar / Living", floor: 1, icon: "Sofa" },
  comedor: { name: "Comedor", floor: 1, icon: "UtensilsCrossed" },
  bano: { name: "Baño", floor: 1, icon: "Bath" },
  // Segundo Piso
  "pieza-grande": { name: "Pieza Grande", floor: 2, icon: "BedDouble" },
  "pieza-mediana": { name: "Pieza Mediana", floor: 2, icon: "Bed" },
  "pieza-pequena": { name: "Pieza Pequeña", floor: 2, icon: "BedSingle" },
  pasillo: { name: "Pasillo", floor: 2, icon: "Move" },
  // General
  general: { name: "General / Estructura", floor: 0, icon: "Home" },
};

// Mapeo de categorías
export const categoriesConfig: Record<
  ExpenseCategory,
  { name: string; color: string }
> = {
  materiales: { name: "Materiales de Construcción", color: "bg-orange-500" },
  muebles: { name: "Muebles", color: "bg-blue-500" },
  decoracion: { name: "Decoración", color: "bg-pink-500" },
  electrodomesticos: { name: "Electrodomésticos", color: "bg-purple-500" },
  iluminacion: { name: "Iluminación", color: "bg-yellow-500" },
  plomeria: { name: "Plomería", color: "bg-cyan-500" },
  electricidad: { name: "Electricidad", color: "bg-amber-500" },
  otros: { name: "Otros", color: "bg-slate-500" },
};

// Catálogo inicial de items
export const initialItems: Item[] = [
  {
    id: "item-1",
    name: "Volcanita Standard 10mm (1.2x2.4)",
    unitPrice: 9392,
    category: "materiales",
    link: "https://www.sodimac.cl/sodimac-cl/product/110157/volcanita-standard",
    createdAt: "2024-01-10",
  },
  {
    id: "item-2",
    name: "Volcanita RH (Verde) 10mm",
    description: "Resistente a la humedad, ideal para baños",
    unitPrice: 15289,
    category: "materiales",
    link: "https://www.sodimac.cl/sodimac-cl/product/110158/volcanita-rh",
    createdAt: "2024-01-10",
  },
  {
    id: "item-3",
    name: "Porcelanato 60x60",
    description: "Porcelanato para pisos",
    unitPrice: 12490,
    category: "materiales",
    createdAt: "2024-01-10",
  },
  {
    id: "item-4",
    name: "Piso Flotante 8mm",
    unitPrice: 13990,
    category: "materiales",
    createdAt: "2024-01-10",
  },
  {
    id: "item-5",
    name: "Puerta Interior Completa",
    description: "Puerta + marco + bisagras",
    unitPrice: 38990,
    category: "materiales",
    createdAt: "2024-01-10",
  },
  {
    id: "item-6",
    name: "Ventana Termopanel 1.2x1.0m",
    unitPrice: 118000,
    category: "materiales",
    createdAt: "2024-01-10",
  },
  {
    id: "item-7",
    name: "Muebles de cocina modulares",
    description: "Set completo de muebles altos y bajos",
    unitPrice: 850000,
    category: "muebles",
    notes: "Cotización pendiente",
    createdAt: "2024-01-15",
  },
  {
    id: "item-8",
    name: "Cocina encimera 4 platos",
    unitPrice: 189990,
    category: "electrodomesticos",
    link: "https://www.falabella.com/falabella-cl/product/12345/cocina-encimera",
    createdAt: "2024-01-15",
  },
  {
    id: "item-9",
    name: "Campana extractora",
    unitPrice: 89990,
    category: "electrodomesticos",
    createdAt: "2024-01-15",
  },
  {
    id: "item-10",
    name: "Sofá 3 cuerpos",
    unitPrice: 450000,
    category: "muebles",
    createdAt: "2024-01-20",
  },
  {
    id: "item-11",
    name: "WC + Lavamanos + Accesorios",
    description: "Set completo de baño",
    unitPrice: 320000,
    category: "plomeria",
    createdAt: "2024-01-20",
  },
  {
    id: "item-12",
    name: "Cama 2 plazas con colchón",
    unitPrice: 399990,
    category: "muebles",
    link: "https://www.paris.cl/cama-2-plazas",
    createdAt: "2024-01-25",
  },
];

// Gastos iniciales que referencian items
export const initialExpenses: Expense[] = [
  {
    id: "exp-1",
    itemId: "item-1",
    quantity: 88,
    room: "general",
    floor: 0,
    date: "2024-01-15",
    paid: true,
    paidBy: "jessenia",
  },
  {
    id: "exp-2",
    itemId: "item-2",
    quantity: 25,
    room: "bano",
    floor: 1,
    date: "2024-01-15",
    paid: true,
    paidBy: "jessenia",
  },
  {
    id: "exp-3",
    itemId: "item-3",
    quantity: 38,
    room: "general",
    floor: 1,
    date: "2024-01-20",
    paid: false,
  },
  {
    id: "exp-4",
    itemId: "item-4",
    quantity: 35,
    room: "general",
    floor: 2,
    date: "2024-01-20",
    paid: false,
  },
  {
    id: "exp-5",
    itemId: "item-5",
    quantity: 6,
    room: "general",
    floor: 0,
    date: "2024-01-25",
    paid: false,
  },
  {
    id: "exp-6",
    itemId: "item-6",
    quantity: 9,
    room: "general",
    floor: 0,
    date: "2024-01-25",
    paid: false,
  },
  {
    id: "exp-7",
    itemId: "item-7",
    quantity: 1,
    room: "cocina",
    floor: 1,
    date: "2024-02-01",
    paid: false,
    notes: "Cotización pendiente",
  },
  {
    id: "exp-8",
    itemId: "item-8",
    quantity: 1,
    room: "cocina",
    floor: 1,
    date: "2024-02-01",
    paid: false,
  },
  {
    id: "exp-9",
    itemId: "item-9",
    quantity: 1,
    room: "cocina",
    floor: 1,
    date: "2024-02-01",
    paid: false,
  },
  {
    id: "exp-10",
    itemId: "item-10",
    quantity: 1,
    room: "living",
    floor: 1,
    date: "2024-02-05",
    paid: false,
  },
  {
    id: "exp-11",
    itemId: "item-11",
    quantity: 1,
    room: "bano",
    floor: 1,
    date: "2024-02-10",
    paid: false,
  },
  {
    id: "exp-12",
    itemId: "item-12",
    quantity: 1,
    room: "pieza-grande",
    floor: 2,
    date: "2024-02-15",
    paid: false,
  },
];

// Funciones de utilidad
export const formatCurrency = (amount: number): string => {
  return `$${Math.round(amount).toLocaleString("es-CL")}`;
};

export const getTotalBudget = (): number => {
  return contributors.reduce((sum, c) => sum + c.contribution, 0);
};

export const getExpenseAmount = (expense: Expense, items: Item[]): number => {
  const item = items.find((i) => i.id === expense.itemId);
  return item ? item.unitPrice * expense.quantity : 0;
};

export const getTotalExpenses = (
  expenses: Expense[],
  items: Item[],
): number => {
  return expenses.reduce((sum, e) => sum + getExpenseAmount(e, items), 0);
};

export const getTotalPaid = (expenses: Expense[], items: Item[]): number => {
  return expenses
    .filter((e) => e.paid)
    .reduce((sum, e) => sum + getExpenseAmount(e, items), 0);
};

export const getTotalPending = (expenses: Expense[], items: Item[]): number => {
  return expenses
    .filter((e) => !e.paid)
    .reduce((sum, e) => sum + getExpenseAmount(e, items), 0);
};

export const getExpensesByRoom = (
  expenses: Expense[],
  room: Room,
): Expense[] => {
  return expenses.filter((e) => e.room === room);
};

export const getExpensesByFloor = (
  expenses: Expense[],
  floor: Floor,
): Expense[] => {
  return expenses.filter((e) => e.floor === floor);
};

export const getExpensesByCategory = (
  expenses: Expense[],
  items: Item[],
  category: ExpenseCategory,
): Expense[] => {
  return expenses.filter((e) => {
    const item = items.find((i) => i.id === e.itemId);
    return item?.category === category;
  });
};

export const getRoomTotal = (
  expenses: Expense[],
  items: Item[],
  room: Room,
): number => {
  return getExpensesByRoom(expenses, room).reduce(
    (sum, e) => sum + getExpenseAmount(e, items),
    0,
  );
};

export const getFloorTotal = (
  expenses: Expense[],
  items: Item[],
  floor: Floor,
): number => {
  return getExpensesByFloor(expenses, floor).reduce(
    (sum, e) => sum + getExpenseAmount(e, items),
    0,
  );
};

export const getCategoryTotal = (
  expenses: Expense[],
  items: Item[],
  category: ExpenseCategory,
): number => {
  return getExpensesByCategory(expenses, items, category).reduce(
    (sum, e) => sum + getExpenseAmount(e, items),
    0,
  );
};

export const getContributorPaid = (
  expenses: Expense[],
  items: Item[],
  contributorId: string,
): number => {
  return expenses
    .filter((e) => e.paid && e.paidBy === contributorId)
    .reduce((sum, e) => sum + getExpenseAmount(e, items), 0);
};

export const getHouseArea = (): number => {
  return (
    projectInfo.house.width *
    projectInfo.house.length *
    projectInfo.house.floors
  );
};

export const getLandArea = (): number => {
  return projectInfo.land.width * projectInfo.land.length;
};

export const getItemById = (items: Item[], id: string): Item | undefined => {
  return items.find((i) => i.id === id);
};
