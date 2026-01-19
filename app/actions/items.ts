"use server";

import { db } from "@/app/db";
import { items, type Item, type NewItem } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Obtener todos los items
export async function getItems(): Promise<Item[]> {
  try {
    const result = await db.select().from(items).orderBy(items.createdAt);
    return result;
  } catch (error) {
    console.error("Error fetching items:", error);
    throw new Error("Error al obtener los productos");
  }
}

// Obtener un item por ID
export async function getItemById(id: number): Promise<Item | null> {
  try {
    const result = await db.select().from(items).where(eq(items.id, id));
    return result[0] || null;
  } catch (error) {
    console.error("Error fetching item:", error);
    throw new Error("Error al obtener el producto");
  }
}

// Crear un nuevo item
export async function createItem(data: {
  name: string;
  description?: string;
  unitPrice: number;
  category: string;
  link?: string;
  notes?: string;
}): Promise<Item> {
  try {
    const newItem: NewItem = {
      name: data.name,
      description: data.description || null,
      unitPrice: data.unitPrice,
      category: data.category,
      link: data.link || null,
      notes: data.notes || null,
    };

    const result = await db.insert(items).values(newItem).returning();
    revalidatePath("/");
    return result[0];
  } catch (error) {
    console.error("Error creating item:", error);
    throw new Error("Error al crear el producto");
  }
}

// Actualizar un item
export async function updateItem(
  id: number,
  data: {
    name?: string;
    description?: string;
    unitPrice?: number;
    category?: string;
    link?: string;
    notes?: string;
  }
): Promise<Item> {
  try {
    const result = await db
      .update(items)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(items.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Producto no encontrado");
    }

    revalidatePath("/");
    return result[0];
  } catch (error) {
    console.error("Error updating item:", error);
    throw new Error("Error al actualizar el producto");
  }
}

// Eliminar un item
export async function deleteItem(id: number): Promise<void> {
  try {
    const result = await db.delete(items).where(eq(items.id, id)).returning();

    if (result.length === 0) {
      throw new Error("Producto no encontrado");
    }

    revalidatePath("/");
  } catch (error) {
    console.error("Error deleting item:", error);
    throw new Error("Error al eliminar el producto. Verifica que no tenga gastos asociados.");
  }
}
