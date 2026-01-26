CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"room" text NOT NULL,
	"floor" integer DEFAULT 0 NOT NULL,
	"date" text NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"paid_by" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"unit_price" integer NOT NULL,
	"category" text NOT NULL,
	"link" text,
	"local_price" integer,
	"local_description" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volcanita_calculations" (
	"id" serial PRIMARY KEY NOT NULL,
	"habitacion" text NOT NULL,
	"tipo_superficie" text NOT NULL,
	"orientacion" text NOT NULL,
	"ancho" real NOT NULL,
	"alto" real NOT NULL,
	"ancho_ventana" real DEFAULT 0 NOT NULL,
	"alto_ventana" real DEFAULT 0 NOT NULL,
	"tipo_volcanita" text NOT NULL,
	"area_neto" real NOT NULL,
	"planchas_requeridas" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;