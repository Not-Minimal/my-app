"use server";

import { db } from "@/app/db";
import {
  sikaCalculations,
  sikaConfig,
  type NewSikaCalculation,
  type NewSikaConfig,
} from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Función auxiliar para calcular volumen y área
function calculateVolumeAndArea(data: {
  qty: number;
  length: number;
  width: number;
  height: number;
}) {
  const volume = data.qty * data.length * data.width * data.height;
  const area = data.qty * data.length * data.width;
  return { volume, area };
}

// ==================== SIKA CALCULATIONS ====================

// Crear un nuevo cálculo de Sika
export async function createSikaCalculation(
  data: Omit<NewSikaCalculation, "volume" | "area">,
) {
  const { volume, area } = calculateVolumeAndArea({
    qty: data.qty ?? 1,
    length: data.length ?? 0,
    width: data.width ?? 0,
    height: data.height ?? 0,
  });

  const [newCalculation] = await db
    .insert(sikaCalculations)
    .values({
      ...data,
      volume,
      area,
    })
    .returning();

  revalidatePath("/");
  return newCalculation;
}

// Actualizar un cálculo existente
export async function updateSikaCalculation(
  id: number,
  data: Partial<Omit<NewSikaCalculation, "id" | "volume" | "area">>,
) {
  // Si se actualizan dimensiones, recalcular volumen y área
  let calculatedValues = {};

  if (
    data.qty !== undefined ||
    data.length !== undefined ||
    data.width !== undefined ||
    data.height !== undefined
  ) {
    // Obtener valores actuales
    const [current] = await db
      .select()
      .from(sikaCalculations)
      .where(eq(sikaCalculations.id, id));

    if (current) {
      const newData = {
        qty: data.qty ?? current.qty,
        length: data.length ?? current.length,
        width: data.width ?? current.width,
        height: data.height ?? current.height,
      };

      calculatedValues = calculateVolumeAndArea(newData);
    }
  }

  const [updated] = await db
    .update(sikaCalculations)
    .set({
      ...data,
      ...calculatedValues,
      updatedAt: new Date(),
    })
    .where(eq(sikaCalculations.id, id))
    .returning();

  revalidatePath("/");
  return updated;
}

// Eliminar un cálculo
export async function deleteSikaCalculation(id: number) {
  await db.delete(sikaCalculations).where(eq(sikaCalculations.id, id));
  revalidatePath("/");
}

// Obtener todos los cálculos
export async function getSikaCalculations() {
  return await db
    .select()
    .from(sikaCalculations)
    .orderBy(sikaCalculations.createdAt);
}

// ==================== SIKA CONFIG ====================

// Obtener configuración por tipo (radier o zapata)
export async function getSikaConfig(tipo: "radier" | "zapata") {
  const [config] = await db
    .select()
    .from(sikaConfig)
    .where(eq(sikaConfig.tipo, tipo));

  // Si no existe, crear configuración por defecto
  if (!config) {
    const defaultConfig: NewSikaConfig =
      tipo === "radier"
        ? {
            tipo: "radier",
            cement: 11.12,
            sand: 55.6,
            gravel: 66.7,
            water: 16.7,
            sikaDosage: 2.0,
            sikaContainer: 18,
            waste: 10,
          }
        : {
            tipo: "zapata",
            cement: 7.2,
            sand: 57.6,
            gravel: 72.0,
            water: 18.0,
            sikaDosage: 1.5,
            sikaContainer: 18,
            waste: 10,
          };

    const [newConfig] = await db
      .insert(sikaConfig)
      .values(defaultConfig)
      .returning();

    return newConfig;
  }

  return config;
}

// Actualizar configuración
export async function updateSikaConfig(
  tipo: "radier" | "zapata",
  data: Partial<Omit<NewSikaConfig, "id" | "tipo">>,
) {
  // Verificar si existe la configuración
  const [existing] = await db
    .select()
    .from(sikaConfig)
    .where(eq(sikaConfig.tipo, tipo));

  if (existing) {
    // Actualizar existente
    const [updated] = await db
      .update(sikaConfig)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(sikaConfig.tipo, tipo))
      .returning();

    revalidatePath("/");
    return updated;
  } else {
    // Crear nueva configuración
    const defaultConfig: NewSikaConfig =
      tipo === "radier"
        ? {
            tipo: "radier",
            cement: 11.12,
            sand: 55.6,
            gravel: 66.7,
            water: 16.7,
            sikaDosage: 2.0,
            sikaContainer: 18,
            waste: 10,
          }
        : {
            tipo: "zapata",
            cement: 7.2,
            sand: 57.6,
            gravel: 72.0,
            water: 18.0,
            sikaDosage: 1.5,
            sikaContainer: 18,
            waste: 10,
          };

    const [newConfig] = await db
      .insert(sikaConfig)
      .values({ ...defaultConfig, ...data })
      .returning();

    revalidatePath("/");
    return newConfig;
  }
}

// Obtener todas las configuraciones
export async function getAllSikaConfigs() {
  return await db.select().from(sikaConfig);
}

// Resetear todos los cálculos (opcional)
export async function resetSikaCalculations() {
  await db.delete(sikaCalculations);
  revalidatePath("/");
}
