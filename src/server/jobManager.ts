/**
 * jobManager.ts
 * --------------------------------------------------------------------------
 * Bridges the live in-process scan progress (fast, in-memory) with durable
 * Postgres storage (scan_jobs / js_secrets / api_endpoints). Acts as the
 * substitute for the spec's Redis job queue + pub/sub progress channel,
 * adapted to this platform's Next.js + Postgres stack.
 */
import { db } from "@/db";
import { apiEndpoints, jsSecrets, scanJobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { SecretFinding } from "./scanner/jsScanner";
import type { ApiFinding } from "./scanner/apiScanner";

export interface LiveProgress {
  status: "queued" | "running" | "completed" | "failed";
  error?: string | null;
  jsTotal: number;
  jsScanned: number;
  jsSecretsFound: number;
  jsStatus: "queued" | "crawling" | "scanning" | "completed";
  apiTotal: number;
  apiScanned: number;
  apiFound: number;
  apiStatus: "queued" | "scanning" | "completed";
}

const liveJobs = new Map<string, LiveProgress>();
const lastDbFlush = new Map<string, number>();
const DB_FLUSH_INTERVAL_MS = 400;

export function initLiveJob(jobId: string) {
  liveJobs.set(jobId, {
    status: "queued",
    jsTotal: 0,
    jsScanned: 0,
    jsSecretsFound: 0,
    jsStatus: "queued",
    apiTotal: 0,
    apiScanned: 0,
    apiFound: 0,
    apiStatus: "queued",
  });
}

export function getLiveProgress(jobId: string): LiveProgress | undefined {
  return liveJobs.get(jobId);
}

export async function patchProgress(jobId: string, patch: Partial<LiveProgress>, force = false) {
  const current = liveJobs.get(jobId);
  if (!current) return;
  Object.assign(current, patch);

  const now = Date.now();
  const last = lastDbFlush.get(jobId) ?? 0;
  if (force || now - last >= DB_FLUSH_INTERVAL_MS) {
    lastDbFlush.set(jobId, now);
    await db
      .update(scanJobs)
      .set({
        status: current.status,
        error: current.error ?? null,
        jsTotal: current.jsTotal,
        jsScanned: current.jsScanned,
        jsSecretsFound: current.jsSecretsFound,
        jsStatus: current.jsStatus,
        apiTotal: current.apiTotal,
        apiScanned: current.apiScanned,
        apiFound: current.apiFound,
        apiStatus: current.apiStatus,
        ...(current.status === "completed" || current.status === "failed"
          ? { finishedAt: new Date() }
          : {}),
      })
      .where(eq(scanJobs.id, jobId));
  }
}

// ---------------------------------------------------------------------------
// Batched finding inserts - avoids one INSERT per finding under heavy load.
// ---------------------------------------------------------------------------
const secretBuffers = new Map<string, SecretFinding[]>();
const apiBuffers = new Map<string, ApiFinding[]>();
const BATCH_SIZE = 25;

export function bufferSecret(jobId: string, finding: SecretFinding) {
  const buf = secretBuffers.get(jobId) ?? [];
  buf.push(finding);
  secretBuffers.set(jobId, buf);
  if (buf.length >= BATCH_SIZE) void flushSecrets(jobId);
}

export async function flushSecrets(jobId: string) {
  const buf = secretBuffers.get(jobId);
  if (!buf || buf.length === 0) return;
  secretBuffers.set(jobId, []);
  await db.insert(jsSecrets).values(
    buf.map((f) => ({
      jobId,
      type: f.type,
      severity: f.severity,
      secretPreview: f.secretPreview,
      file: f.file,
      line: f.line,
    })),
  );
}

export function bufferApiFinding(jobId: string, finding: ApiFinding) {
  const buf = apiBuffers.get(jobId) ?? [];
  buf.push(finding);
  apiBuffers.set(jobId, buf);
  if (buf.length >= BATCH_SIZE) void flushApiFindings(jobId);
}

export async function flushApiFindings(jobId: string) {
  const buf = apiBuffers.get(jobId);
  if (!buf || buf.length === 0) return;
  apiBuffers.set(jobId, []);
  await db.insert(apiEndpoints).values(
    buf.map((f) => ({
      jobId,
      path: f.path,
      method: f.method,
      status: f.status,
      severity: f.severity,
      responseTimeMs: f.responseTimeMs,
      sizeBytes: f.sizeBytes,
      interesting: f.interesting,
    })),
  );
}

export async function flushAll(jobId: string) {
  await Promise.all([flushSecrets(jobId), flushApiFindings(jobId)]);
}

export function cleanupLiveJob(jobId: string, delayMs = 10 * 60 * 1000) {
  setTimeout(() => {
    liveJobs.delete(jobId);
    lastDbFlush.delete(jobId);
    secretBuffers.delete(jobId);
    apiBuffers.delete(jobId);
  }, delayMs);
}
