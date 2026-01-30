CREATE TABLE "insulation_calculations" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre_zona" text NOT NULL,
	"tipo_estructura" text NOT NULL,
	"tipo_superficie" text NOT NULL,
	"floor" integer DEFAULT 1 NOT NULL,
	"ancho" real DEFAULT 0 NOT NULL,
	"alto" real DEFAULT 0 NOT NULL,
	"largo" real DEFAULT 0 NOT NULL,
	"ancho_puerta" real DEFAULT 0 NOT NULL,
	"alto_puerta" real DEFAULT 0 NOT NULL,
	"ancho_ventana" real DEFAULT 0 NOT NULL,
	"alto_ventana" real DEFAULT 0 NOT NULL,
	"area" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
