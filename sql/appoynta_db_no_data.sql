-- Adminer 5.2.1 PostgreSQL 17.4 dump

\connect "appoynta_db";

DROP TABLE IF EXISTS "appointment_details";
DROP SEQUENCE IF EXISTS appointment_details_id_seq;
CREATE SEQUENCE appointment_details_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 11 CACHE 1;

CREATE TABLE "public"."appointment_details" (
    "id" integer DEFAULT nextval('appointment_details_id_seq') NOT NULL,
    "appointment_id" integer NOT NULL,
    "host_id" integer,
    "visitor_id" integer,
    CONSTRAINT "appointment_details_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "xor_constraint" CHECK (((host_id IS NULL) AND (visitor_id IS NOT NULL)) OR ((host_id IS NOT NULL) AND (visitor_id IS NULL)))
) WITH (oids = false);

CREATE UNIQUE INDEX appointment_details_unique ON public.appointment_details USING btree (appointment_id, host_id, visitor_id);


DROP TABLE IF EXISTS "appointment_guest";
DROP SEQUENCE IF EXISTS appointment_guest_id_seq;
CREATE SEQUENCE appointment_guest_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 22 CACHE 1;

CREATE TABLE "public"."appointment_guest" (
    "id" integer DEFAULT nextval('appointment_guest_id_seq') NOT NULL,
    "appointment_id" integer NOT NULL,
    "visitor_id" integer NOT NULL,
    "tag" character varying(255) DEFAULT 'Guest' NOT NULL,
    CONSTRAINT "appointment_guest_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

CREATE UNIQUE INDEX unique_appointment_guest ON public.appointment_guest USING btree (appointment_id, visitor_id);


DROP TABLE IF EXISTS "appointment_host";
DROP SEQUENCE IF EXISTS appointment_host_id_seq;
CREATE SEQUENCE appointment_host_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 16 CACHE 1;

CREATE TABLE "public"."appointment_host" (
    "id" integer DEFAULT nextval('appointment_host_id_seq') NOT NULL,
    "appointment_id" integer NOT NULL,
    "host_id" integer NOT NULL,
    "tag" character varying(255) DEFAULT 'Host' NOT NULL,
    CONSTRAINT "appointment_host_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

CREATE UNIQUE INDEX unique_appointment_host ON public.appointment_host USING btree (appointment_id, host_id);


DROP TABLE IF EXISTS "appointments";
DROP SEQUENCE IF EXISTS appointments_id_seq;
CREATE SEQUENCE appointments_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 14 CACHE 1;

CREATE TABLE "public"."appointments" (
    "id" integer DEFAULT nextval('appointments_id_seq') NOT NULL,
    "appointment_type" appointment_type NOT NULL,
    "topic" character varying(255),
    "start_date" date NOT NULL,
    "end_date" date NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "note" text,
    "status" appointment_status NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "attendance_logs";
DROP SEQUENCE IF EXISTS attendance_logs_id_seq;
CREATE SEQUENCE attendance_logs_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 7 CACHE 1;

CREATE TABLE "public"."attendance_logs" (
    "id" integer DEFAULT nextval('attendance_logs_id_seq') NOT NULL,
    "appointment_id" integer,
    "visitor_id" integer,
    "badge_id" character varying(255) NOT NULL,
    "check_in_time" timestamp NOT NULL,
    "check_out_time" timestamp,
    "note" text,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    CONSTRAINT "attendance_logs_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "audit_logs";
DROP SEQUENCE IF EXISTS audit_logs_id_seq;
CREATE SEQUENCE audit_logs_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 6 CACHE 1;

CREATE TABLE "public"."audit_logs" (
    "id" integer DEFAULT nextval('audit_logs_id_seq') NOT NULL,
    "action" character varying(50) NOT NULL,
    "table_name" character varying(255) NOT NULL,
    "record_id" integer NOT NULL,
    "previous_data" jsonb,
    "performed_by" integer,
    "performed_at" timestamp DEFAULT now(),
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "departments";
DROP SEQUENCE IF EXISTS departments_id_seq;
CREATE SEQUENCE departments_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 9 CACHE 1;

CREATE TABLE "public"."departments" (
    "id" integer DEFAULT nextval('departments_id_seq') NOT NULL,
    "department" character varying(255) NOT NULL,
    "status" user_status NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

CREATE UNIQUE INDEX departments_department_unique ON public.departments USING btree (department);


DROP TABLE IF EXISTS "designations";
DROP SEQUENCE IF EXISTS designations_id_seq;
CREATE SEQUENCE designations_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 11 CACHE 1;

CREATE TABLE "public"."designations" (
    "id" integer DEFAULT nextval('designations_id_seq') NOT NULL,
    "designation" character varying(255) NOT NULL,
    "status" user_status NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

CREATE UNIQUE INDEX designations_designation_unique ON public.designations USING btree (designation);


DROP TABLE IF EXISTS "menu_item_roles";
DROP SEQUENCE IF EXISTS menu_item_roles_id_seq;
CREATE SEQUENCE menu_item_roles_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 7 CACHE 1;

CREATE TABLE "public"."menu_item_roles" (
    "id" integer DEFAULT nextval('menu_item_roles_id_seq') NOT NULL,
    "menu_item_id" integer NOT NULL,
    "role_id" integer NOT NULL,
    CONSTRAINT "menu_item_roles_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "menu_items";
DROP SEQUENCE IF EXISTS menu_items_id_seq;
CREATE SEQUENCE menu_items_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 8 CACHE 1;

CREATE TABLE "public"."menu_items" (
    "id" integer DEFAULT nextval('menu_items_id_seq') NOT NULL,
    "label" text NOT NULL,
    "href" text NOT NULL,
    "permission" text NOT NULL,
    "order" integer NOT NULL,
    "menuicon" text,
    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "permissions";
DROP SEQUENCE IF EXISTS permissions_id_seq;
CREATE SEQUENCE permissions_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 41 CACHE 1;

CREATE TABLE "public"."permissions" (
    "id" integer DEFAULT nextval('permissions_id_seq') NOT NULL,
    "name" character varying(100) NOT NULL,
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

CREATE UNIQUE INDEX permissions_name_unique ON public.permissions USING btree (name);


DROP TABLE IF EXISTS "refresh_tokens";
DROP SEQUENCE IF EXISTS refresh_tokens_id_seq;
CREATE SEQUENCE refresh_tokens_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "public"."refresh_tokens" (
    "id" integer DEFAULT nextval('refresh_tokens_id_seq') NOT NULL,
    "user_id" integer NOT NULL,
    "token" character varying(255) NOT NULL,
    "issued_at" timestamp DEFAULT now(),
    "expires_at" timestamp NOT NULL,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "role_permissions";
CREATE TABLE "public"."role_permissions" (
    "role_id" integer NOT NULL,
    "permission_id" integer NOT NULL,
    CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY ("role_id", "permission_id")
) WITH (oids = false);


DROP TABLE IF EXISTS "roles";
DROP SEQUENCE IF EXISTS roles_id_seq;
CREATE SEQUENCE roles_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 6 CACHE 1;

CREATE TABLE "public"."roles" (
    "id" integer DEFAULT nextval('roles_id_seq') NOT NULL,
    "name" text NOT NULL,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


DROP TABLE IF EXISTS "users";
DROP SEQUENCE IF EXISTS users_id_seq;
CREATE SEQUENCE users_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 25 CACHE 1;

CREATE TABLE "public"."users" (
    "id" integer DEFAULT nextval('users_id_seq') NOT NULL,
    "first_name" character varying(255) NOT NULL,
    "username" character varying(255) NOT NULL,
    "email" character varying(255),
    "telephone" character varying(255) NOT NULL,
    "password" character varying(255) NOT NULL,
    "role_id" integer NOT NULL,
    "status" user_status NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    "last_name" character varying(255) NOT NULL,
    "department_id" smallint,
    "designation_id" smallint,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

CREATE UNIQUE INDEX users_username_unique ON public.users USING btree (username);

CREATE UNIQUE INDEX users_email_unique ON public.users USING btree (email);

CREATE UNIQUE INDEX users_telephone_unique ON public.users USING btree (telephone);


DROP TABLE IF EXISTS "visitors";
DROP SEQUENCE IF EXISTS visitors_id_seq;
CREATE SEQUENCE visitors_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 11 CACHE 1;

CREATE TABLE "public"."visitors" (
    "id" integer DEFAULT nextval('visitors_id_seq') NOT NULL,
    "name" character varying(255) NOT NULL,
    "email" character varying(255),
    "phone" character varying(255) NOT NULL,
    "whatsapp" visitor_whatsapp,
    "gender" visitor_gender,
    "company" character varying(255),
    "nid" character varying(255),
    "image_pp" character varying(255),
    "image_av" character varying(255),
    "note" text,
    "status" visitor_status,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    "face_descriptors" jsonb,
    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

CREATE UNIQUE INDEX visitors_email_unique ON public.visitors USING btree (email);

CREATE UNIQUE INDEX visitors_phone_unique ON public.visitors USING btree (phone);

CREATE UNIQUE INDEX visitors_nid_unique ON public.visitors USING btree (nid);


ALTER TABLE ONLY "public"."appointment_details" ADD CONSTRAINT "appointment_details_appointment_id_appointments_id_fk" FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."appointment_details" ADD CONSTRAINT "appointment_details_host_id_users_id_fk" FOREIGN KEY (host_id) REFERENCES users(id) NOT DEFERRABLE;
ALTER TABLE ONLY "public"."appointment_details" ADD CONSTRAINT "appointment_details_visitor_id_visitors_id_fk" FOREIGN KEY (visitor_id) REFERENCES visitors(id) NOT DEFERRABLE;

ALTER TABLE ONLY "public"."appointment_guest" ADD CONSTRAINT "appointment_guest_appointment_id_fkey" FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."appointment_guest" ADD CONSTRAINT "appointment_guest_visitor_id_fkey" FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE NOT DEFERRABLE;

ALTER TABLE ONLY "public"."appointment_host" ADD CONSTRAINT "appointment_host_appointment_id_fkey" FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."appointment_host" ADD CONSTRAINT "appointment_host_host_id_fkey" FOREIGN KEY (host_id) REFERENCES users(id) NOT DEFERRABLE;

ALTER TABLE ONLY "public"."attendance_logs" ADD CONSTRAINT "attendance_logs_appointment_id_appointments_id_fk" FOREIGN KEY (appointment_id) REFERENCES appointments(id) NOT DEFERRABLE;
ALTER TABLE ONLY "public"."attendance_logs" ADD CONSTRAINT "attendance_logs_visitor_id_visitors_id_fk" FOREIGN KEY (visitor_id) REFERENCES visitors(id) NOT DEFERRABLE;

ALTER TABLE ONLY "public"."menu_item_roles" ADD CONSTRAINT "menu_item_roles_menu_item_id_menu_items_id_fk" FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."menu_item_roles" ADD CONSTRAINT "menu_item_roles_role_id_roles_id_fk" FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE NOT DEFERRABLE;

ALTER TABLE ONLY "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE NOT DEFERRABLE;

ALTER TABLE ONLY "public"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "public"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE NOT DEFERRABLE;

ALTER TABLE ONLY "public"."users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY (role_id) REFERENCES roles(id) NOT DEFERRABLE;

-- 2025-05-14 06:44:35 UTC
