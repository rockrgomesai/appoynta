// db/schema.ts
import { pgEnum, pgTable, serial, varchar, integer, text, timestamp, date, time, boolean, jsonb, primaryKey, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { MenuItem } from '@/types/MenuItem';
// Enums
export const userStatus = pgEnum('user_status', ['Active', 'Inactive']);
export const appointmentStatus = pgEnum('appointment_status', ['Active', 'Inactive']);
export const appointmentType = pgEnum('appointment_type', ['Delivery', 'Demo', 'Interview', 'Maintenance', 'Meeting', 'Other', 'Personal', 'Program', 'Project', 'Training']);
export const visitorStatus = pgEnum('visitor_status', ['Active', 'Inactive']);
export const visitorGender = pgEnum('visitor_gender', ['Male', 'Female', 'Other']);
export const visitorWhatsapp = pgEnum('visitor_whatsapp', ['Yes', 'No']);

// Tables
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
});

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
});

export const rolePermissions = pgTable('role_permissions', {
  role_id: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: integer('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey(table.role_id, table.permissionId),
}));

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  first_name: varchar('first_name', { length: 255 }).notNull(),
  last_name: varchar('last_name', { length: 255 }).notNull(), // Added last_name column
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).unique(),
  password: varchar('password', { length: 255 }).notNull(),
  telephone: varchar('telephone', { length: 255 }).notNull().unique(),
  department_id: integer('department_id').notNull().references(() => departments.id),
  designation_id: integer('designation_id').notNull().references(() => designations.id), 
  role_id: integer('role_id').notNull().references(() => roles.id),
  status: userStatus('status').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  department: varchar('department', { length: 255 }).notNull().unique(),
  status: userStatus('status').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const designations = pgTable('designations', {
  id: serial('id').primaryKey(),
  designation: varchar('designation', { length: 255 }).notNull().unique(),
  status: userStatus('status').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const visitors = pgTable('visitors', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 255 }).notNull().unique(),
  whatsapp: visitorWhatsapp('whatsapp'),
  gender: visitorGender('gender'),
  company: varchar('company', { length: 255 }),
  nid: varchar('nid', { length: 255 }).unique(),
  image_pp: varchar('image_pp', { length: 255 }), // Profile photo path
  face_descriptors: jsonb('face_descriptors'), // Facial recognition data
  note: text('note'),
  status: visitorStatus('status'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  appointment_type: appointmentType('appointment_type').notNull(),
  topic: varchar('topic', { length: 255 }),
  start_date: date('start_date').notNull(),
  end_date: date('end_date').notNull(),
  start_time: time('start_time').notNull(),
  end_time: time('end_time').notNull(),
  note: text('note'),
  status: appointmentStatus('status').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const appointment_host = pgTable('appointment_host', {
  id: serial('id').primaryKey(),
  appointment_id: integer('appointment_id').notNull().references(() => appointments.id, { onDelete: 'cascade' }),
  host_id: integer('host_id').references(() => users.id).notNull(),
  tag: varchar('tag', { length: 255 }).notNull().default('Host')
}, (table) => ({
  uniqueAppointmentHost: uniqueIndex('unique_appointment_host').on(table.appointment_id, table.host_id),
}));

export const appointment_guest = pgTable('appointment_guest', {
  id: serial('id').primaryKey(),
  appointment_id: integer('appointment_id').notNull().references(() => appointments.id, { onDelete: 'cascade' }),
  visitor_id: integer('visitor_id').notNull().references(() => visitors.id, { onDelete: 'cascade' }),
  tag: varchar('tag', { length: 255 }).notNull().default('Guest')
}, (table) => ({
  uniqueAppointmentHost: uniqueIndex('unique_appointment_guest').on(table.appointment_id, table.visitor_id),
}));

export const userStatusEnum = pgEnum("user_status", ["Active", "Inactive"]);

export const attendance_logs = pgTable("attendance_logs", {
  id: serial("id").primaryKey(),
  appointment_id: integer("appointment_id"),
  visitor_id: integer("visitor_id"),
  badge_id: varchar("badge_id", { length: 255 }).notNull(),
  check_in_time: timestamp("check_in_time").notNull(),
  check_out_time: timestamp("check_out_time"),
  note: text("note"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  action: varchar('action', { length: 50 }).notNull(),
  tableName: varchar('table_name', { length: 255 }).notNull(),
  recordId: integer('record_id').notNull(),
  previousData: jsonb('previous_data'),
  performedBy: integer('performed_by'),
  performedAt: timestamp('performed_at').defaultNow(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull(),
  issuedAt: timestamp('issued_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
});



// Forward declaration for self-reference
let _menuItems: any;

export const menuItems = _menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  href: text("href"),
  permission: text("permission").notNull(),
  order: integer("order").notNull(),
  menuicon: text("menuicon"),
  // Add parent_id for hierarchical structure
  parent_id: integer("parent_id").references(() => _menuItems.id, { 
    onDelete: "cascade" 
  }),
  // Add is_submenu flag
  is_submenu: boolean("is_submenu").default(false).notNull(),
});

// Junction Table: Menu Item Roles
export const menuItemRoles = pgTable("menu_item_roles", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
  role_id: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
});
