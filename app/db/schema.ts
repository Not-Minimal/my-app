import { pgTable, text, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";

// Tabla de Items (Catálogo de productos)
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  unitPrice: integer("unit_price").notNull(), // Precio en CLP (sin decimales)
  category: text("category").notNull(), // materiales, muebles, decoracion, etc.
  link: text("link"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabla de Expenses (Gastos)
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => items.id),
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
