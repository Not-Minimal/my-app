"use server";

import { db } from "@/app/db";
import { expenses, type Expense, type NewExpense } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Obtener todos los gastos
export async function getExpenses(): Promise<Expense[]> {
  try {
    const result = await db.select().from(expenses).orderBy(expenses.createdAt);
    return result;
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw new Error("Error al obtener los gastos");
  }
}

// Obtener un gasto por ID
export async function getExpenseById(id: number): Promise<Expense | null> {
  try {
    const result = await db.select().from(expenses).where(eq(expenses.id, id));
    return result[0] || null;
  } catch (error) {
    console.error("Error fetching expense:", error);
    throw new Error("Error al obtener el gasto");
  }
}

// Obtener gastos por item ID
export async function getExpensesByItemId(itemId: number): Promise<Expense[]> {
  try {
    const result = await db
      .select()
      .from(expenses)
      .where(eq(expenses.itemId, itemId));
    return result;
  } catch (error) {
    console.error("Error fetching expenses by item:", error);
    throw new Error("Error al obtener los gastos del producto");
  }
}

// Crear un nuevo gasto
export async function createExpense(data: {
  itemId: number;
  quantity: number;
  room: string;
  floor: number;
  date: string;
  paid?: boolean;
  paidBy?: string;
  notes?: string;
}): Promise<Expense> {
  try {
    const newExpense: NewExpense = {
      itemId: data.itemId,
      quantity: data.quantity,
      room: data.room,
      floor: data.floor,
      date: data.date,
      paid: data.paid || false,
      paidBy: data.paidBy || null,
      notes: data.notes || null,
    };

    const result = await db.insert(expenses).values(newExpense).returning();
    revalidatePath("/");
    return result[0];
  } catch (error) {
    console.error("Error creating expense:", error);
    throw new Error("Error al crear el gasto");
  }
}

// Actualizar un gasto
export async function updateExpense(
  id: number,
  data: {
    itemId?: number;
    quantity?: number;
    room?: string;
    floor?: number;
    date?: string;
    paid?: boolean;
    paidBy?: string | null;
    notes?: string;
  }
): Promise<Expense> {
  try {
    const result = await db
      .update(expenses)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Gasto no encontrado");
    }

    revalidatePath("/");
    return result[0];
  } catch (error) {
    console.error("Error updating expense:", error);
    throw new Error("Error al actualizar el gasto");
  }
}

// Actualizar cantidad de un gasto
export async function updateExpenseQuantity(
  id: number,
  quantity: number
): Promise<Expense> {
  if (quantity < 1) {
    throw new Error("La cantidad debe ser al menos 1");
  }
  return updateExpense(id, { quantity });
}

// Marcar como pagado/no pagado
export async function toggleExpensePaid(
  id: number,
  paidBy?: string
): Promise<Expense> {
  try {
    // Primero obtenemos el estado actual
    const current = await getExpenseById(id);
    if (!current) {
      throw new Error("Gasto no encontrado");
    }

    const newPaidStatus = !current.paid;

    const result = await db
      .update(expenses)
      .set({
        paid: newPaidStatus,
        paidBy: newPaidStatus ? (paidBy || null) : null,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, id))
      .returning();

    revalidatePath("/");
    return result[0];
  } catch (error) {
    console.error("Error toggling expense paid status:", error);
    throw new Error("Error al actualizar el estado de pago");
  }
}

// Eliminar un gasto
export async function deleteExpense(id: number): Promise<void> {
  try {
    const result = await db
      .delete(expenses)
      .where(eq(expenses.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Gasto no encontrado");
    }

    revalidatePath("/");
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw new Error("Error al eliminar el gasto");
  }
}
