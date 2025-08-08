import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "./shared/schema.ts",  // adjust if your schema is in another folder
  out: "./drizzle",           // migrations output folder
  dialect: "postgresql",      // correct dialect for Postgres
  dbCredentials: {
    url: "postgresql://beachdo_user:ahm287@localhost:5432/beachdo_db",

  },
});
