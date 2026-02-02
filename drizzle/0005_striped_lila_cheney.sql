CREATE TABLE "sika_calculations" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" text NOT NULL,
	"name" text NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"length" real DEFAULT 0 NOT NULL,
	"width" real DEFAULT 0 NOT NULL,
	"height" real DEFAULT 0 NOT NULL,
	"volume" real DEFAULT 0 NOT NULL,
	"area" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sika_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" text NOT NULL,
	"cement" real DEFAULT 0 NOT NULL,
	"sand" real DEFAULT 0 NOT NULL,
	"gravel" real DEFAULT 0 NOT NULL,
	"water" real DEFAULT 0 NOT NULL,
	"sika_dosage" real DEFAULT 0 NOT NULL,
	"sika_container" real DEFAULT 18 NOT NULL,
	"waste" real DEFAULT 10 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sika_config_tipo_unique" UNIQUE("tipo")
);
