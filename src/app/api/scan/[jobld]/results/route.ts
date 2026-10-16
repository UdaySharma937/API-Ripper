import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { apiEndpoints, jsSecrets, scanJobs } from "@/db/schema";

export const dynamic = "force-dynamic";

// GET /api/scan/{jobId}/results -> final/partial findings for both scanners.
export async function GET(_req: NextRequest, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;

  const [job] = await db.select().from(scanJobs).where(eq(scanJobs.id, jobId)).limit(1);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const [secrets, endpoints] = await Promise.all([
    db
      .select()
      .from(jsSecrets)
      .where(eq(jsSecrets.jobId, jobId))
      .orderBy(desc(jsSecrets.createdAt))
      .limit(20000),
    db
      .select()
      .from(apiEndpoints)
      .where(eq(apiEndpoints.jobId, jobId))
      .orderBy(desc(apiEndpoints.createdAt))
      .limit(20000),
  ]);

  return NextResponse.json({
    job,
    secrets,
    endpoints,
  });
}
