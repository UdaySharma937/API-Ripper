import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { scanJobs } from "@/db/schema";
import { getLiveProgress } from "@/server/jobManager";

export const dynamic = "force-dynamic";

// GET /api/scan/{jobId}/status -> live progress snapshot.
// Prefers the in-memory live progress (sub-second freshness) and falls back
// to the durable Postgres row (e.g. after a process restart).
export async function GET(_req: NextRequest, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;

  const live = getLiveProgress(jobId);
  if (live) {
    return NextResponse.json({ job_id: jobId, ...live });
  }

  const [row] = await db.select().from(scanJobs).where(eq(scanJobs.id, jobId)).limit(1);
  if (!row) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    job_id: row.id,
    status: row.status,
    error: row.error,
    jsTotal: row.jsTotal,
    jsScanned: row.jsScanned,
    jsSecretsFound: row.jsSecretsFound,
    jsStatus: row.jsStatus,
    apiTotal: row.apiTotal,
    apiScanned: row.apiScanned,
    apiFound: row.apiFound,
    apiStatus: row.apiStatus,
  });
}
