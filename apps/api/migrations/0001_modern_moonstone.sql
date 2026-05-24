CREATE TABLE "proyectos" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"codigo" varchar(50) NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"estado" varchar(20) DEFAULT 'PLANIFICACION' NOT NULL,
	"cliente_id" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proyectos_codigo_unique" UNIQUE("codigo"),
	CONSTRAINT "estado_check" CHECK ("proyectos"."estado" IN ('PLANIFICACION','EN_EJECUCION','FINALIZADO','SUSPENDIDO'))
);
--> statement-breakpoint
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_cliente_id_users_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_projecto_id_proyectos_id_fk" FOREIGN KEY ("projecto_id") REFERENCES "public"."proyectos"("id") ON DELETE cascade ON UPDATE no action;