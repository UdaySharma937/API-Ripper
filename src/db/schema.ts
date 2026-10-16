// Drizzle ORM schema for APIRipper
// Tables: scan_jobs (job/progress tracking), js_secrets (secret findings),
// api_endpoints (endpoint bruteforce findings)
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  real,
  index,
} from "drizzle-orm/pg-core";

export const scanJobs = pgTable("scan_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  targetUrl: text("target_url").notNull(),

  // overall lifecycle: queued -> running -> completed -> failed
  status: text("status").notNull().default("queued"),
  error: text("error"),

  // JS scanner progress
  jsTotal: integer("js_total").notNull().default(0),
  jsScanned: integer("js_scanned").notNull().default(0),
  jsSecretsFound: integer("js_secrets_found").notNull().default(0),
  jsStatus: text("js_status").notNull().default("queued"),

  // API scanner progress
  apiTotal: integer("api_total").notNull().default(0),
  apiScanned: integer("api_scanned").notNull().default(0),
  apiFound: integer("api_found").notNull().default(0),
  apiStatus: text("api_status").notNull().default("queued"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

export const jsSecrets = pgTable(
  "js_secrets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => scanJobs.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    severity: text("severity").notNull(),
    secretPreview: text("secret_preview").notNull(),
    file: text("file").notNull(),
    line: integer("line").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("js_secrets_job_id_idx").on(table.jobId)],
);

export const apiEndpoints = pgTable(
  "api_endpoints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => scanJobs.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    method: text("method").notNull(),
    status: integer("status").notNull(),
    severity: text("severity").notNull(),
    responseTimeMs: real("response_time_ms").notNull().default(0),
    sizeBytes: integer("size_bytes").notNull().default(0),
    interesting: boolean("interesting").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("api_endpoints_job_id_idx").on(table.jobId)],
);
