import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scanJobs } from "@/db/schema";
import { assertPublicHttpUrl } from "@/server/scanner/ssrfGuard";
import { runScan } from "@/server/scanner/orchestrator";
import { cleanupLiveJob } from "@/server/jobManager";

export const dynamic = "force-dynamic";

// POST /api/scan/start -> { job_id }
export async function POST(req: NextRequest) {
  let body: { targetUrl?: string; target_url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const targetUrl = (body.targetUrl ?? body.target_url ?? "").trim();
  if (!targetUrl) {
    return NextResponse.json({ error: "targetUrl is required" }, { status: 400 });
  }

  let normalizedUrl: string;
  try {
    const withScheme = /^https?:\/\//i.test(targetUrl) ? targetUrl : `https://${targetUrl}`;
    const url = await assertPublicHttpUrl(withScheme);
    normalizedUrl = url.toString();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid target URL";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const [job] = await db
    .insert(scanJobs)
    .values({ targetUrl: normalizedUrl, status: "queued" })
    .returning({ id: scanJobs.id });

  // Fire-and-forget: the Node process stays alive (persistent server), so we
  // can run the scan in the background without a separate worker/queue.
  void runScan(job.id, normalizedUrl).finally(() => cleanupLiveJob(job.id));

  return NextResponse.json({ job_id: job.id, jobId: job.id }, { status: 201 });
}
