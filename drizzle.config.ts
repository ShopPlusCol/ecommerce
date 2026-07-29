import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/infrastructure/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.SQLITE_PATH ?? "./.data/local.db",
  },
  verbose: true,
  strict: true,
});
