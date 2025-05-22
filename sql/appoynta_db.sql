-- Adminer 5.2.1 PostgreSQL 17.4 dump


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

INSERT INTO "appointment_details" ("id", "appointment_id", "host_id", "visitor_id") VALUES
(7,	1,	1,	NULL),
(8,	1,	NULL,	1),
(9,	1,	NULL,	2),
(10,	1,	2,	NULL);

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

INSERT INTO "appointment_guest" ("id", "appointment_id", "visitor_id", "tag") VALUES
(1,	1,	1,	'Guest'),
(2,	1,	2,	'Guest'),
(3,	2,	1,	'Guest'),
(5,	2,	2,	'Guest'),
(6,	4,	2,	'Guest'),
(7,	4,	1,	'Guest'),
(10,	2,	8,	'Guest'),
(11,	2,	6,	'Guest'),
(12,	3,	1,	'Guest'),
(13,	3,	2,	'Guest'),
(14,	5,	4,	'Guest'),
(15,	5,	5,	'Guest'),
(16,	8,	2,	'Guest'),
(17,	8,	5,	'Guest'),
(18,	8,	6,	'Guest'),
(19,	12,	6,	'Guest'),
(20,	10,	6,	'Guest'),
(21,	11,	6,	'Guest');

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

INSERT INTO "appointment_host" ("id", "appointment_id", "host_id", "tag") VALUES
(1,	1,	1,	'Host'),
(2,	1,	2,	'Host'),
(3,	2,	23,	'Host'),
(4,	2,	24,	'Host'),
(6,	2,	15,	'Host'),
(7,	2,	19,	'Host'),
(8,	3,	23,	'Host'),
(9,	3,	24,	'Host'),
(10,	4,	23,	'Host'),
(11,	4,	3,	'Host'),
(12,	5,	24,	'Host'),
(13,	5,	19,	'Host'),
(14,	8,	20,	'Host'),
(15,	8,	16,	'Host');

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

INSERT INTO "appointments" ("id", "appointment_type", "topic", "start_date", "end_date", "start_time", "end_time", "note", "status", "created_at", "updated_at") VALUES
(1,	'Meeting',	'Project Kickoff',	'2025-05-01',	'2025-05-01',	'09:00:00',	'10:00:00',	NULL,	'Active',	'2025-04-21 19:26:51.213926',	'2025-04-21 19:26:51.213926'),
(2,	'Demo',	'Product Demo',	'2025-05-02',	'2025-05-02',	'11:00:00',	'12:00:00',	NULL,	'Active',	'2025-04-21 19:26:51.213926',	'2025-04-21 19:26:51.213926'),
(3,	'Delivery',	'Package Delivery',	'2025-05-03',	'2025-05-03',	'14:00:00',	'14:30:00',	NULL,	'Inactive',	'2025-04-21 19:26:51.213926',	'2025-04-21 19:26:51.213926'),
(4,	'Personal',	'Doctor Visit',	'2025-05-04',	'2025-05-04',	'15:00:00',	'16:00:00',	NULL,	'Active',	'2025-04-21 19:26:51.213926',	'2025-04-21 19:26:51.213926'),
(5,	'Project',	'Sprint Review',	'2025-05-05',	'2025-05-05',	'10:00:00',	'11:00:00',	NULL,	'Active',	'2025-04-21 19:26:51.213926',	'2025-04-21 19:26:51.213926'),
(7,	'Project',	'Project 1',	'2025-05-10',	'2025-05-10',	'10:00:00',	'11:00:00',	'',	'Active',	'2025-05-08 21:09:04.083663',	'2025-05-08 21:09:04.083663'),
(9,	'Meeting',	'Cybersecurity',	'2025-05-10',	'2025-05-10',	'10:00:00',	'11:00:00',	'Some note',	'Active',	'2025-05-09 10:47:27.755605',	'2025-05-09 10:47:27.755605'),
(8,	'Project',	'Project 2',	'2025-05-10',	'2025-05-12',	'10:00:00',	'11:00:00',	'',	'Active',	'2025-05-09 08:46:04.0729',	'2025-05-09 08:46:04.0729'),
(10,	'Demo',	'Software demonstrationn',	'2025-05-14',	'2025-05-14',	'14:00:00',	'16:00:00',	'',	'Active',	'2025-05-13 02:47:30.677519',	'2025-05-13 02:47:30.677519'),
(13,	'Project',	'Environmental strategy',	'2025-05-15',	'2025-05-16',	'10:00:00',	'12:00:00',	'',	'Active',	'2025-05-13 04:15:35.181234',	'2025-05-13 04:15:35.181234'),
(12,	'Demo',	'Visitor management 2',	'2025-05-14',	'2025-05-17',	'11:00:00',	'12:00:00',	'Note edited',	'Active',	'2025-05-13 02:51:14.498886',	'2025-05-13 02:51:14.498886'),
(11,	'Project',	'Server Maintenance',	'2025-05-13',	'2025-05-16',	'10:30:00',	'16:40:00',	'',	'Inactive',	'2025-05-13 02:50:21.535237',	'2025-05-13 02:50:21.535237');

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

INSERT INTO "attendance_logs" ("id", "appointment_id", "visitor_id", "badge_id", "check_in_time", "check_out_time", "note", "created_at", "updated_at") VALUES
(1,	NULL,	4,	'B-4',	'2025-04-21 19:26:51.218',	NULL,	NULL,	'2025-04-21 19:26:51.21993',	'2025-04-21 19:26:51.21993'),
(2,	NULL,	3,	'B-3',	'2025-04-21 19:26:51.218',	NULL,	NULL,	'2025-04-21 19:26:51.219988',	'2025-04-21 19:26:51.219988'),
(3,	NULL,	2,	'B-2',	'2025-04-21 19:26:51.218',	NULL,	NULL,	'2025-04-21 19:26:51.219904',	'2025-04-21 19:26:51.219904'),
(4,	NULL,	1,	'B-1',	'2025-04-21 19:26:51.218',	NULL,	NULL,	'2025-04-21 19:26:51.219782',	'2025-04-21 19:26:51.219782'),
(5,	NULL,	5,	'B-5',	'2025-04-21 19:26:51.218',	NULL,	NULL,	'2025-04-21 19:26:51.220621',	'2025-04-21 19:26:51.220621'),
(6,	12,	6,	'SIB-2022',	'2025-05-13 11:33:01.623',	NULL,	NULL,	'2025-05-13 11:33:02.121881',	'2025-05-13 11:33:02.121881');

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

INSERT INTO "audit_logs" ("id", "action", "table_name", "record_id", "previous_data", "performed_by", "performed_at") VALUES
(1,	'create',	'users',	1,	NULL,	1,	'2025-04-21 19:26:51.222514'),
(2,	'update',	'roles',	1,	NULL,	2,	'2025-04-21 19:26:51.222514'),
(3,	'delete',	'visitors',	3,	NULL,	3,	'2025-04-21 19:26:51.222514'),
(4,	'create',	'appointments',	4,	NULL,	4,	'2025-04-21 19:26:51.222514'),
(5,	'update',	'departments',	1,	NULL,	5,	'2025-04-21 19:26:51.222514');

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

INSERT INTO "departments" ("id", "department", "status", "created_at", "updated_at") VALUES
(1,	'Special Branch',	'Active',	'2025-04-21 19:26:51.079286',	'2025-04-21 19:26:51.079286'),
(2,	'Homeland Security',	'Active',	'2025-04-21 19:26:51.079286',	'2025-04-21 19:26:51.079286'),
(3,	'General Services',	'Active',	'2025-04-21 19:26:51.079286',	'2025-04-21 19:26:51.079286'),
(4,	'Procurement',	'Active',	'2025-04-21 19:26:51.079286',	'2025-04-21 19:26:51.079286'),
(5,	'Information Technology',	'Active',	'2025-04-21 19:26:51.079286',	'2025-04-21 19:26:51.079286'),
(8,	'Internal Security',	'Active',	'2025-05-04 03:56:23.938158',	'2025-05-04 03:56:23.938158');

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

INSERT INTO "designations" ("id", "designation", "status", "created_at", "updated_at") VALUES
(1,	'Director',	'Active',	'2025-04-21 19:26:51.082455',	'2025-04-21 19:26:51.082455'),
(2,	'GSO1',	'Active',	'2025-04-21 19:26:51.082455',	'2025-04-21 19:26:51.082455'),
(3,	'GSO2',	'Active',	'2025-04-21 19:26:51.082455',	'2025-04-21 19:26:51.082455'),
(5,	'Petty Officer',	'Active',	'2025-04-21 19:26:51.082455',	'2025-04-21 19:26:51.082455'),
(7,	'Subedar',	'Active',	'2025-04-24 06:07:26.292496',	'2025-04-24 06:07:26.292496'),
(4,	'ADOS1',	'Active',	'2025-04-21 19:26:51.082455',	'2025-04-21 19:26:51.082455'),
(10,	'Additional DG',	'Inactive',	'2025-05-03 04:19:43.614944',	'2025-05-03 04:19:43.614944');

DROP TABLE IF EXISTS "menu_item_roles";
DROP SEQUENCE IF EXISTS menu_item_roles_id_seq;
CREATE SEQUENCE menu_item_roles_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 7 CACHE 1;

CREATE TABLE "public"."menu_item_roles" (
    "id" integer DEFAULT nextval('menu_item_roles_id_seq') NOT NULL,
    "menu_item_id" integer NOT NULL,
    "role_id" integer NOT NULL,
    CONSTRAINT "menu_item_roles_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

INSERT INTO "menu_item_roles" ("id", "menu_item_id", "role_id") VALUES
(1,	1,	1),
(3,	2,	1),
(4,	3,	1),
(5,	4,	1),
(6,	5,	1);

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

INSERT INTO "menu_items" ("id", "label", "href", "permission", "order", "menuicon") VALUES
(2,	'Manage Users',	'/main/users',	'manage_users',	2,	'FaUsers'),
(1,	'Dashboard',	'/main/dashboard',	'manage_dashboard',	1,	'FaRectangleList'),
(3,	'Departments',	'/main/departments',	'manage_reports',	3,	'FaSitemap'),
(4,	'Designations',	'/main/designations',	'manage_designations',	4,	'FaRegIdCard'),
(5,	'Visitors',	'/main/visitors',	'manage_visitors',	5,	'FaIdCardClip'),
(6,	'Appointments',	'/main/appointments',	'manage_appointments',	6,	'FaCalendarDays'),
(7,	'Front Desk',	'/main/desk/visitor',	'manage_desk_visitor',	7,	'FaDesktop');

DROP TABLE IF EXISTS "permissions";
DROP SEQUENCE IF EXISTS permissions_id_seq;
CREATE SEQUENCE permissions_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 41 CACHE 1;

CREATE TABLE "public"."permissions" (
    "id" integer DEFAULT nextval('permissions_id_seq') NOT NULL,
    "name" character varying(100) NOT NULL,
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

CREATE UNIQUE INDEX permissions_name_unique ON public.permissions USING btree (name);

INSERT INTO "permissions" ("id", "name") VALUES
(1,	'view:users'),
(2,	'create:users'),
(3,	'update:users'),
(4,	'delete:users'),
(5,	'view:appointments'),
(6,	'view:visitors'),
(7,	'create:visitors'),
(8,	'view:roles'),
(9,	'create:roles'),
(10,	'update:roles'),
(11,	'delete:roles'),
(12,	'view:departments'),
(13,	'create:departments'),
(14,	'update:departments'),
(15,	'delete:departments'),
(16,	'view:designations'),
(17,	'create:designations'),
(18,	'update:designations'),
(19,	'delete:designations'),
(20,	'create:appointments'),
(21,	'update:appointments'),
(22,	'delete:appointments'),
(23,	'view:appointment_details'),
(24,	'create:appointment_details'),
(25,	'update:appointment_details'),
(26,	'delete:appointment_details'),
(27,	'view:attendance_logs'),
(28,	'create:attendance_logs'),
(29,	'update:attendance_logs'),
(30,	'delete:attendance_logs'),
(31,	'create:appointment_host'),
(32,	'view:appointment_host'),
(33,	'update:appointment_host'),
(34,	'delete:appointment_host'),
(35,	'create:appointment_guest'),
(36,	'update:appointment_guest'),
(37,	'view:appointment_guest'),
(38,	'delete:appointment_guest'),
(39,	'update:visitors'),
(40,	'delete:visitors');

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

INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES
(1,	1),
(1,	3),
(1,	5),
(4,	5),
(1,	2),
(4,	1),
(1,	4),
(1,	6),
(1,	7),
(1,	8),
(1,	9),
(1,	10),
(1,	11),
(1,	12),
(1,	13),
(1,	14),
(1,	15),
(1,	16),
(1,	17),
(1,	18),
(1,	19),
(1,	20),
(1,	21),
(1,	22),
(1,	23),
(1,	24),
(1,	25),
(1,	26),
(1,	27),
(1,	28),
(1,	29),
(1,	30),
(1,	31),
(1,	32),
(1,	33),
(1,	34),
(1,	35),
(1,	36),
(1,	37),
(1,	38),
(1,	39),
(1,	40);

DROP TABLE IF EXISTS "roles";
DROP SEQUENCE IF EXISTS roles_id_seq;
CREATE SEQUENCE roles_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 6 CACHE 1;

CREATE TABLE "public"."roles" (
    "id" integer DEFAULT nextval('roles_id_seq') NOT NULL,
    "name" text NOT NULL,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

INSERT INTO "roles" ("id", "name") VALUES
(1,	'Super Admin'),
(2,	'Admin'),
(3,	'Officer'),
(4,	'Desk Operator');

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

INSERT INTO "users" ("id", "first_name", "username", "email", "telephone", "password", "role_id", "status", "created_at", "updated_at", "last_name", "department_id", "designation_id") VALUES
(4,	'Dave',	'dave',	'dave@example.com',	'4567890123',	'$2b$10$HDcmdaq7WzcmVFJTQWlKhevEdAmfqAsfVxvmwlzlEJ5lKjND.xGUu',	4,	'Inactive',	'2025-04-23 12:02:57.124377',	'2025-04-23 12:02:57.124377',	'Wonderland',	2,	2),
(23,	'Tedd',	'tedd',	'tedd@xmail.com',	'01701301773',	'$2b$10$57dQaU.yeKH/vq.Db6AMUuHwiTGO3Nqkqural1bvwsx44mkX0iTEy',	1,	'Active',	'2025-05-04 14:26:34.549121',	'2025-05-04 14:26:34.549121',	'Button',	3,	1),
(24,	'Oscar',	'oscar',	'oscar@os.com',	'01999988777',	'$2b$10$Ts.p1yMNJlmKtAWgWfgBnOIkxslq2W5P1iz.xOkNdUa9hH18TaS6e',	2,	'Active',	'2025-05-04 22:25:43.171653',	'2025-05-04 22:25:43.171653',	'Gomes',	5,	1),
(15,	'Ted',	'ted',	'ted@xmail.com',	'01701301778',	'$2b$10$VXRen1q3Nj0tIYEyqKPIKuyWBZf8JN94/UhlQ.0VWwHqlH7wARVLm',	1,	'Active',	'2025-04-24 03:30:05.15544',	'2025-04-24 03:30:05.15544',	'Button',	4,	1),
(19,	'Rock',	'rocky',	'rocky@test.com',	'01901901997',	'$2b$10$OF5IgHywkHpcmLH3Q1eJXOV4slX2G5TYQ/0ckpH8umww1S1qtbg9y',	1,	'Active',	'2025-04-30 19:51:11.995885',	'2025-04-30 19:51:11.995885',	'Gomes',	2,	5),
(16,	'Rock',	'rock',	'rock@example.com',	'01901901999',	'$2b$10$nLx1Qv3F1Ja5NQ6Kgf.NaOJBhdd15nmDcBwnxokm9DBHk4zvU/yaa',	2,	'Active',	'2025-04-30 05:07:37.642683',	'2025-04-30 05:07:37.642683',	'Gomes',	3,	3),
(20,	'Jasmin',	'jasmin',	'jasmin@test.com',	'01901901996',	'$2b$10$Dpp8FPnueH2KXSUg8PZw2ON3xwT.6QUz48r0hz3Yrgpy3gXokn5f6',	2,	'Active',	'2025-04-30 19:51:59.099057',	'2025-04-30 19:51:59.099057',	'Gus',	4,	4),
(17,	'Rick',	'rick',	'bob@xample.com',	'01910919988',	'$2b$10$1KWHigDqW6wTYAWxjCez1euqezssB0WCbDj1ezmevCeIdq/FiIBjm',	3,	'Inactive',	'2025-04-30 05:25:47.487249',	'2025-04-30 05:25:47.487249',	'Roland',	4,	8),
(18,	'Maka',	'maka',	'maka@naki.com',	'21231341422',	'$2b$10$HXx4d2ZeHngnt3a2.VitKOXkP4WmiEfSg4iwmK56eiOdIEOte4vja',	3,	'Active',	'2025-04-30 06:08:48.069145',	'2025-04-30 06:08:48.069145',	'Naki',	5,	6),
(3,	'Carol',	'carol',	'carol@example.com',	'34567890123',	'$2b$10$ZMWFmtup6SdZiwcYoWC8x.aaY5F659glv4XFMJLg8HvVJDQt.EsYS',	4,	'Active',	'2025-04-23 12:02:57.124377',	'2025-04-23 12:02:57.124377',	'Wonderland',	3,	3),
(2,	'Bob',	'bob',	'bob@example.com',	'23456789012',	'$2b$10$J0vByZI2T5hJVkBxgfkCquAoxx7IriiRJMhVR24zzjizP4GBrd.uy',	2,	'Active',	'2025-04-23 12:02:57.124377',	'2025-04-23 12:02:57.124377',	'Wonderland',	4,	7),
(1,	'Alice',	'alice',	'alice@example.com',	'12345678901',	'$2b$10$OUeoVgPX6CqhRpiUEKIwbOh1PGMM8X4PBa2l1HA.DVEYYOUHRP3eG',	1,	'Active',	'2025-04-23 12:02:57.124377',	'2025-04-23 12:02:57.124377',	'Wonderland',	4,	2),
(21,	'Jhaka',	'jhaka',	'jhaka@email.com',	'01701901997',	'$2b$10$0Pv1MXY7scPxRr9PoBkCj.3wLS.PuOa4fdlHgXRywdfWsULhz4VKG',	2,	'Active',	'2025-04-30 21:17:31.456787',	'2025-04-30 21:17:31.456787',	'Naka',	2,	3);

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

INSERT INTO "visitors" ("id", "name", "email", "phone", "whatsapp", "gender", "company", "nid", "image_pp", "note", "status", "created_at", "updated_at", "face_descriptors") VALUES
(1,	'Visitor One',	NULL,	'1111111111',	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,		'Active',	'2025-04-21 19:26:51.211831',	'2025-04-21 19:26:51.211831',	NULL),
(2,	'Visitor Two',	NULL,	'2222222222',	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,		'Active',	'2025-04-21 19:26:51.211831',	'2025-04-21 19:26:51.211831',	NULL),
(3,	'Visitor Three',	NULL,	'3333333333',	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,		'Inactive',	'2025-04-21 19:26:51.211831',	'2025-04-21 19:26:51.211831',	NULL),
(4,	'Visitor Four',	NULL,	'4444444444',	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,		'Active',	'2025-04-21 19:26:51.211831',	'2025-04-21 19:26:51.211831',	NULL),
(5,	'Visitor Five',	NULL,	'5555555555',	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,		'Active',	'2025-04-21 19:26:51.211831',	'2025-04-21 19:26:51.211831',	NULL),
(6,	'Rock',	NULL,	'01312210266',	'No',	NULL,	NULL,	NULL,	NULL,	NULL,		'Active',	'2025-04-22 00:40:33.023399',	'2025-04-22 00:40:33.023399',	NULL),
(7,	'Rick',	NULL,	'01712210266',	'No',	NULL,	NULL,	NULL,	NULL,	NULL,		'Active',	'2025-04-22 08:02:41.673718',	'2025-04-22 08:02:41.673718',	NULL),
(8,	'Rahim',	NULL,	'01712210277',	'No',	'Male',	NULL,	NULL,	NULL,	NULL,		'Active',	'2025-04-22 08:07:40.868765',	'2025-04-22 08:07:40.868765',	NULL),
(9,	'Oscar',	'',	'01989899899',	'No',	'Male',	'',	'',	NULL,		'',	'Active',	'2025-05-06 03:13:25.891393',	'2025-05-06 03:13:25.891393',	NULL),
(10,	'Anjelina',	'anjelina@email.com',	'01795222777',	'Yes',	'Female',	'Shundari',	'111-222-4444',	NULL,		'Note ',	'Active',	'2025-05-13 05:59:57.932075',	'2025-05-13 05:59:57.932075',	NULL);

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

-- 2025-05-14 06:44:26 UTC
