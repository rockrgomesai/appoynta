//import { defineConfig } from 'drizzle-kit'

import { defineConfig } from "drizzle-kit";

// via connection params
export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "postgres",
    database: "appoynta_db",
    ssl: false
  }
});