import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apiEndpoints, jsSecrets, scanJobs } from "@/db/schema";

export const dynamic = "force-dynamic";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown) => {
    const s = String(val ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

// GET /api/scan/{jobId}/export?format=json|csv&dataset=secrets|endpoints|all
export async function GET(req: NextRequest, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const format = req.nextUrl.searchParams.get("format") ?? "json";
  const dataset = req.nextUrl.searchParams.get("dataset") ?? "all";

  const [job] = await db.select().from(scanJobs).where(eq(scanJobs.id, jobId)).limit(1);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const secrets =
    dataset === "endpoints"
      ? []
      : await db.select().from(jsSecrets).where(eq(jsSecrets.jobId, jobId));
  const endpoints =
    dataset === "secrets"
      ? []
      : await db.select().from(apiEndpoints).where(eq(apiEndpoints.jobId, jobId));

  if (format === "csv") {
    const csvParts: string[] = [];
    if (secrets.length) csvParts.push("JS SECRETS\n" + toCsv(secrets));
    if (endpoints.length) csvParts.push("API ENDPOINTS\n" + toCsv(endpoints));
    const body = csvParts.join("\n\n") || "No data";
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="apiripper-${jobId}.csv"`,
      },
    });
  }

  return NextResponse.json(
    { job, secrets, endpoints, exportedAt: new Date().toISOString() },
    {
      headers: {
        "Content-Disposition": `attachment; filename="apiripper-${jobId}.json"`,
      },
    },
  );
}
