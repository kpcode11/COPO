/**
 * Prisma configuration file for migrations and migration tooling.
 * - Move connection strings out of schema.prisma into this file.
 * - Set migrate.url for `prisma migrate` and optionally a shadow database.
 * - Keep secrets in environment variables (DATABASE_URL, DATABASE_SHADOW_URL).
 */
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});