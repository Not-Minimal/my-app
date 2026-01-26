"use server";

import { db } from "@/app/db";
import { volcanitaCalculations, type NewVolcanitaCalculation } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const BOARD_AREA = 1.2 * 2.4; // 2.88 m²

// Función auxiliar para calcular el área neta y planchas
function calculateAreaAndBoards(data: {
  ancho: number;
  alto: number;
  anchoVentana: number;
  altoVentana: number;
}) {
  const wallArea = data.ancho * data.alto;
  const windowArea = data.anchoVentana * data.altoVentana;
  const areaNeto = Math.max(0, wallArea - windowArea);
  const planchasRequeridas = Math.ceil(areaNeto / BOARD_AREA);
  
  return { areaNeto, planchasRequeridas };
}

// Crear una nueva fila de cálculo
export async function createVolcanitaCalculation(
  data: Omit<NewVolcanitaCalculation, 'areaNeto' | 'planchasRequeridas'>
) {
  const { areaNeto, planchasRequeridas } = calculateAreaAndBoards({
    ancho: data.ancho,
    alto: data.alto,
    anchoVentana: data.anchoVentana ?? 0,
    altoVentana: data.altoVentana ?? 0,
  });
  
  const [newCalculation] = await db
    .insert(volcanitaCalculations)
    .values({
      ...data,
      areaNeto,
      planchasRequeridas,
    })
    .returning();

  revalidatePath("/");
  return newCalculation;
}

// Actualizar una fila existente
export async function updateVolcanitaCalculation(
  id: number,
  data: Partial<Omit<NewVolcanitaCalculation, 'id' | 'areaNeto' | 'planchasRequeridas'>>
) {
  // Si se actualizan dimensiones, recalcular área y planchas
  let calculatedValues = {};
  
  if (
    data.ancho !== undefined ||
    data.alto !== undefined ||
    data.anchoVentana !== undefined ||
    data.altoVentana !== undefined
  ) {
    // Obtener valores actuales
    const [current] = await db
      .select()
      .from(volcanitaCalculations)
      .where(eq(volcanitaCalculations.id, id));
    
    if (current) {
      const newData = {
        ancho: data.ancho ?? current.ancho,
        alto: data.alto ?? current.alto,
        anchoVentana: data.anchoVentana ?? current.anchoVentana,
        altoVentana: data.altoVentana ?? current.altoVentana,
      };
      
      calculatedValues = calculateAreaAndBoards(newData);
    }
  }

  const [updated] = await db
    .update(volcanitaCalculations)
    .set({
      ...data,
      ...calculatedValues,
      updatedAt: new Date(),
    })
    .where(eq(volcanitaCalculations.id, id))
    .returning();

  revalidatePath("/");
  return updated;
}

// Eliminar una fila
export async function deleteVolcanitaCalculation(id: number) {
  await db
    .delete(volcanitaCalculations)
    .where(eq(volcanitaCalculations.id, id));

  revalidatePath("/");
}

// Obtener todos los cálculos
export async function getVolcanitaCalculations() {
  return await db
    .select()
    .from(volcanitaCalculations)
    .orderBy(volcanitaCalculations.createdAt);
}

// Resetear todos los cálculos (opcional - para el botón de reset)
export async function resetVolcanitaCalculations() {
  await db.delete(volcanitaCalculations);
  revalidatePath("/");
}
