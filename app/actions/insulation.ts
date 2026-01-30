"use server";

import { db } from "@/app/db";
import {
  insulationCalculations,
  type NewInsulationCalculation,
} from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type CreateInsulationCalculationInput = Omit<
  NewInsulationCalculation,
  "id" | "area" | "createdAt" | "updatedAt"
>;

type UpdateInsulationCalculationInput = Partial<
  Omit<NewInsulationCalculation, "id" | "createdAt" | "updatedAt">
>;

function calculateArea(data: {
  tipoSuperficie: string;
  ancho: number;
  alto: number;
  largo: number;
  anchoPuerta: number;
  altoPuerta: number;
  anchoVentana: number;
  altoVentana: number;
}): number {
  const isCeiling = data.tipoSuperficie.toLowerCase() === "cielo";
  if (isCeiling) {
    const ceilingArea = (data.ancho || 0) * (data.largo || 0);
    return Math.max(0, ceilingArea);
  }

  const wallArea = (data.ancho || 0) * (data.alto || 0);
  const doorArea = (data.anchoPuerta || 0) * (data.altoPuerta || 0);
  const windowArea = (data.anchoVentana || 0) * (data.altoVentana || 0);
  return Math.max(0, wallArea - doorArea - windowArea);
}

export async function createInsulationCalculation(
  data: CreateInsulationCalculationInput,
) {
  const area = calculateArea({
    tipoSuperficie: data.tipoSuperficie,
    ancho: data.ancho ?? 0,
    alto: data.alto ?? 0,
    largo: data.largo ?? 0,
    anchoPuerta: data.anchoPuerta ?? 0,
    altoPuerta: data.altoPuerta ?? 0,
    anchoVentana: data.anchoVentana ?? 0,
    altoVentana: data.altoVentana ?? 0,
  });

  const [created] = await db
    .insert(insulationCalculations)
    .values({ ...data, area })
    .returning();

  revalidatePath("/");
  return created;
}

export async function updateInsulationCalculation(
  id: number,
  data: UpdateInsulationCalculationInput,
) {
  let computedArea: number | undefined;

  const shouldRecalculateArea =
    data.tipoSuperficie !== undefined ||
    data.ancho !== undefined ||
    data.alto !== undefined ||
    data.largo !== undefined ||
    data.anchoPuerta !== undefined ||
    data.altoPuerta !== undefined ||
    data.anchoVentana !== undefined ||
    data.altoVentana !== undefined;

  if (shouldRecalculateArea) {
    const [current] = await db
      .select()
      .from(insulationCalculations)
      .where(eq(insulationCalculations.id, id));

    if (current) {
      computedArea = calculateArea({
        tipoSuperficie: data.tipoSuperficie ?? current.tipoSuperficie,
        ancho: data.ancho ?? current.ancho,
        alto: data.alto ?? current.alto,
        largo: data.largo ?? current.largo,
        anchoPuerta: data.anchoPuerta ?? current.anchoPuerta,
        altoPuerta: data.altoPuerta ?? current.altoPuerta,
        anchoVentana: data.anchoVentana ?? current.anchoVentana,
        altoVentana: data.altoVentana ?? current.altoVentana,
      });
    }
  }

  const [updated] = await db
    .update(insulationCalculations)
    .set({
      ...data,
      ...(computedArea !== undefined ? { area: computedArea } : {}),
      updatedAt: new Date(),
    })
    .where(eq(insulationCalculations.id, id))
    .returning();

  revalidatePath("/");
  return updated;
}

export async function deleteInsulationCalculation(id: number) {
  await db
    .delete(insulationCalculations)
    .where(eq(insulationCalculations.id, id));

  revalidatePath("/");
}

export async function getInsulationCalculations() {
  return db
    .select()
    .from(insulationCalculations)
    .orderBy(insulationCalculations.createdAt);
}

export async function resetInsulationCalculations() {
  await db.delete(insulationCalculations);
  revalidatePath("/");
}
