import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy initialization para evitar errores en build time
let sql: NeonQueryFunction<false, false> | null = null;
let database: NeonHttpDatabase<typeof schema> | null = null;

function getConnection() {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL no está configurada. Por favor configura la variable de entorno DATABASE_URL con tu conexión de Neon.",
      );
    }
    sql = neon(databaseUrl);
  }
  return sql;
}

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!database) {
    database = drizzle(getConnection(), { schema });
  }
  return database;
}

// Para compatibilidad con el código existente - usa getter lazy
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) {
    const instance = getDb();
    const value = instance[prop as keyof typeof instance];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

// Re-exportar el esquema para conveniencia
export * from "./schema";
