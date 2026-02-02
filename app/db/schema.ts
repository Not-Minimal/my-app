import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  real,
} from "drizzle-orm/pg-core";

// Tabla de Items (Catálogo de productos)
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  unitPrice: integer("unit_price").notNull(), // Precio Internet en CLP (sin decimales)
  category: text("category").notNull(), // materiales, muebles, decoracion, etc.
  link: text("link"), // Link del producto en internet
  localPrice: integer("local_price"), // Precio Local (Cañete) en CLP
  localDescription: text("local_description"), // Descripción/tienda local en Cañete
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabla de Expenses (Gastos)
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id),
  quantity: integer("quantity").notNull().default(1),
  room: text("room").notNull(), // cocina, living, comedor, bano, pieza-grande, etc.
  floor: integer("floor").notNull().default(0), // 0 = general, 1 = piso 1, 2 = piso 2
  date: text("date").notNull(), // Fecha en formato YYYY-MM-DD
  paid: boolean("paid").notNull().default(false),
  paidBy: text("paid_by"), // jessenia, saul
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tipos inferidos de Drizzle
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

// Tabla de Volcanita Calculations (Cubicación de Volcanita)
export const volcanitaCalculations = pgTable("volcanita_calculations", {
  id: serial("id").primaryKey(),
  habitacion: text("habitacion").notNull(), // Nombre de la habitación
  floor: integer("floor").notNull().default(1), // 1 = piso 1, 2 = piso 2
  tipoSuperficie: text("tipo_superficie").notNull(), // Pared o Cielo
  orientacion: text("orientacion").notNull(), // Norte, Sur, Este, Oeste, Horizontal
  ancho: real("ancho").notNull(), // Ancho en metros
  alto: real("alto").notNull(), // Alto en metros
  anchoVentana: real("ancho_ventana").notNull().default(0), // Ancho de ventana en metros
  altoVentana: real("alto_ventana").notNull().default(0), // Alto de ventana en metros
  tipoVolcanita: text("tipo_volcanita").notNull(), // ST_CIELO, ST_TABIQUE, RH, RF, ACU
  areaNeto: real("area_neto").notNull(), // Área calculada en m²
  planchasRequeridas: integer("planchas_requeridas").notNull(), // Cantidad de planchas
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type VolcanitaCalculation = typeof volcanitaCalculations.$inferSelect;
export type NewVolcanitaCalculation = typeof volcanitaCalculations.$inferInsert;

// Tabla de Insulation Calculations (Cubicación de Aislación)
export const insulationCalculations = pgTable("insulation_calculations", {
  id: serial("id").primaryKey(),
  room: text("room").notNull().default("general"), // cocina, living, comedor, bano, pieza-grande, etc.
  tipoEstructura: text("tipo_estructura").notNull(), // muro_exterior, cielo_techumbre, tabique_interior
  tipoSuperficie: text("tipo_superficie").notNull(), // Pared o Cielo
  orientacion: text("orientacion").notNull().default("Norte"), // Norte, Sur, Este, Oeste, Cielo
  floor: integer("floor").notNull().default(1), // 1 = Piso 1, 2 = Piso 2
  ancho: real("ancho").notNull().default(0), // Para muros: ancho; para cielos: ancho
  alto: real("alto").notNull().default(0), // Para muros: alto; para cielos puede ser 0
  largo: real("largo").notNull().default(0), // Para cielos: largo (permite cálculos de superficie)
  anchoPuerta: real("ancho_puerta").notNull().default(0),
  altoPuerta: real("alto_puerta").notNull().default(0),
  anchoVentana: real("ancho_ventana").notNull().default(0),
  altoVentana: real("alto_ventana").notNull().default(0),
  area: real("area").notNull().default(0), // Área neta en m² para cubicación
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InsulationCalculation = typeof insulationCalculations.$inferSelect;
export type NewInsulationCalculation =
  typeof insulationCalculations.$inferInsert;

// Tabla de Sika Calculations (Cubicación de Radier/Losa y Zapatas)
export const sikaCalculations = pgTable("sika_calculations", {
  id: serial("id").primaryKey(),
  tipo: text("tipo").notNull(), // 'radier' o 'zapata'
  name: text("name").notNull(), // Nombre descriptivo del elemento
  qty: integer("qty").notNull().default(1), // Cantidad de elementos
  length: real("length").notNull().default(0), // Largo en metros
  width: real("width").notNull().default(0), // Ancho en metros
  height: real("height").notNull().default(0), // Alto/Espesor en metros
  volume: real("volume").notNull().default(0), // Volumen calculado en m³
  area: real("area").notNull().default(0), // Área calculada en m²
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SikaCalculation = typeof sikaCalculations.$inferSelect;
export type NewSikaCalculation = typeof sikaCalculations.$inferInsert;

// Tabla de Sika Configuration (Configuración de dosificación)
export const sikaConfig = pgTable("sika_config", {
  id: serial("id").primaryKey(),
  tipo: text("tipo").notNull().unique(), // 'radier' o 'zapata'
  cement: real("cement").notNull().default(0), // Sacos de cemento por m³
  sand: real("sand").notNull().default(0), // Unidades de arena por m³
  gravel: real("gravel").notNull().default(0), // Unidades de grava por m³
  water: real("water").notNull().default(0), // Litros/unidades de agua por m³
  sikaDosage: real("sika_dosage").notNull().default(0), // kg de Sika por m²
  sikaContainer: real("sika_container").notNull().default(18), // kg por bidón
  waste: real("waste").notNull().default(10), // Porcentaje de desperdicio
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SikaConfig = typeof sikaConfig.$inferSelect;
export type NewSikaConfig = typeof sikaConfig.$inferInsert;
