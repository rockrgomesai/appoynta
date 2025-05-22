-- Migration: Initial schema based on schema.ts
-- Enums
CREATE TYPE user_status AS ENUM ('Active', 'Inactive');
CREATE TYPE appointment_status AS ENUM ('Active', 'Inactive');
CREATE TYPE appointment_type AS ENUM ('Delivery', 'Demo', 'Interview', 'Maintenance', 'Meeting', 'Other', 'Personal', 'Program', 'Project', 'Training');
CREATE TYPE visitor_status AS ENUM ('Active', 'Inactive');
CREATE TYPE visitor_gender AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE visitor_whatsapp AS ENUM ('Yes', 'No');

-- Tables
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  department VARCHAR(255) NOT NULL UNIQUE,
  status user_status NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE designations (
  id SERIAL PRIMARY KEY,
  designation VARCHAR(255) NOT NULL UNIQUE,
  status user_status NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL,
  telephone VARCHAR(255) NOT NULL UNIQUE,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  designation_id INTEGER NOT NULL REFERENCES designations(id),
  role_id INTEGER NOT NULL REFERENCES roles(id),
  status user_status NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE visitors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(255) NOT NULL UNIQUE,
  whatsapp visitor_whatsapp,
  gender visitor_gender,
  company VARCHAR(255),
  nid VARCHAR(255) UNIQUE,
  image_pp VARCHAR(255),
  face_descriptors JSONB,
  note TEXT,
  status visitor_status,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  appointment_type appointment_type NOT NULL,
  topic VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  note TEXT,
  status appointment_status NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE appointment_host (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  host_id INTEGER NOT NULL REFERENCES users(id),
  tag VARCHAR(255) NOT NULL DEFAULT 'Host',
  CONSTRAINT unique_appointment_host UNIQUE (appointment_id, host_id)
);

CREATE TABLE appointment_guest (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  visitor_id INTEGER NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  tag VARCHAR(255) NOT NULL DEFAULT 'Guest',
  CONSTRAINT unique_appointment_guest UNIQUE (appointment_id, visitor_id)
);

CREATE TABLE attendance_logs (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER,
  visitor_id INTEGER,
  badge_id VARCHAR(255) NOT NULL,
  check_in_time TIMESTAMP NOT NULL,
  check_out_time TIMESTAMP,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(255) NOT NULL,
  record_id INTEGER NOT NULL,
  previous_data JSONB,
  performed_by INTEGER,
  performed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  issued_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  permission TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  menuicon TEXT
);

CREATE TABLE menu_item_roles (
  id SERIAL PRIMARY KEY,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE
);
