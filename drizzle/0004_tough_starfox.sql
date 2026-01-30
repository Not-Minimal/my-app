ALTER TABLE "insulation_calculations" ALTER COLUMN "room" SET DEFAULT 'general';--> statement-breakpoint
ALTER TABLE "insulation_calculations" ALTER COLUMN "orientacion" SET DEFAULT 'Norte';--> statement-breakpoint
ALTER TABLE "insulation_calculations" DROP COLUMN "nombre_zona";