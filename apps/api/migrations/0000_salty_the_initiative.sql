CREATE TABLE "users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(20) DEFAULT 'CLIENTE' NOT NULL,
	"reset_token_hash" varchar(64),
	"reset_token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "insumos_maestro" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"unidad" varchar(5) NOT NULL,
	"cost_base" numeric(12, 2) NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insumos_maestro_codigo_unique" UNIQUE("codigo"),
	CONSTRAINT "unidad_check" CHECK ("insumos_maestro"."unidad" IN ('M3','KG','UND','GL'))
);
--> statement-breakpoint
CREATE TABLE "apus" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "apus_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "apu_insumos" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"apu_id" text NOT NULL,
	"insumo_id" text NOT NULL,
	"rendimiento" numeric(12, 4) NOT NULL,
	"desperdicio" numeric(5, 2) DEFAULT '0',
	"unit_price_snapshot" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cotizaciones" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"projecto_id" text NOT NULL,
	"codigo" varchar(50) NOT NULL,
	"version" integer DEFAULT 1,
	"estado" varchar(20) DEFAULT 'BORRADOR' NOT NULL,
	"cliente_id" text,
	"total_cost_direct" numeric(15, 4) DEFAULT '0',
	"factor_a_percentage" numeric(5, 2) DEFAULT '0',
	"factor_b_percentage" numeric(5, 2) DEFAULT '0',
	"profit_margin_percent" numeric(5, 2) DEFAULT '0',
	"total_amount" numeric(15, 4) DEFAULT '0',
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "estado_check" CHECK ("cotizaciones"."estado" IN ('BORRADOR','ENVIADA','APROBADA','REEMPLAZADA'))
);
--> statement-breakpoint
CREATE TABLE "cotizacion_items" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"cotizacion_id" text NOT NULL,
	"apu_id" text NOT NULL,
	"cantidad" numeric(12, 4) NOT NULL,
	"calculated_cost_direct" numeric(15, 4) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" text NOT NULL,
	"action" varchar(10) NOT NULL,
	"user_id" text,
	"data_history" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "action_check" CHECK ("audit_logs"."action" IN ('INSERT','UPDATE','DELETE'))
);
--> statement-breakpoint
ALTER TABLE "insumos_maestro" ADD CONSTRAINT "insumos_maestro_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apus" ADD CONSTRAINT "apus_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apu_insumos" ADD CONSTRAINT "apu_insumos_apu_id_apus_id_fk" FOREIGN KEY ("apu_id") REFERENCES "public"."apus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apu_insumos" ADD CONSTRAINT "apu_insumos_insumo_id_insumos_maestro_id_fk" FOREIGN KEY ("insumo_id") REFERENCES "public"."insumos_maestro"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_cliente_id_users_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizacion_items" ADD CONSTRAINT "cotizacion_items_cotizacion_id_cotizaciones_id_fk" FOREIGN KEY ("cotizacion_id") REFERENCES "public"."cotizaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizacion_items" ADD CONSTRAINT "cotizacion_items_apu_id_apus_id_fk" FOREIGN KEY ("apu_id") REFERENCES "public"."apus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;