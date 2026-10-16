"use client";

import { useState } from "react";
import { FileJson, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ApiEndpointRow, JsSecretRow, ScanJobRecord } from "@/lib/api";
import { exportUrl } from "@/lib/api";

export function ExportTab({
  jobId,
  job,
  secrets,
  endpoints,
}: {
  jobId: string;
  job: ScanJobRecord | undefined;
  secrets: JsSecretRow[];
  endpoints: ApiEndpointRow[];
}) {
  const [generatingPdf, setGeneratingPdf] = useState(false);

  async function handleJsonExport() {
    window.location.href = exportUrl(jobId, "json");
  }

  async function handleCsvExport() {
    window.location.href = exportUrl(jobId, "csv");
  }

  async function handlePdfExport() {
    setGeneratingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Branded header
      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, pageWidth, 70, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("APIRipper", 40, 35);
      doc.setFontSize(10);
      doc.text("High-Speed Attack Surface Scan Report", 40, 52);

      doc.setTextColor(20, 20, 20);
      doc.setFontSize(11);
      let y = 95;
      doc.text(`Target: ${job?.targetUrl ?? "-"}`, 40, y);
      y += 16;
      doc.text(`Status: ${job?.status ?? "-"}`, 40, y);
      y += 16;
      doc.text(`Generated: ${new Date().toLocaleString()}`, 40, y);
      y += 16;
      doc.text(
        `Findings: ${secrets.length} JS secrets · ${endpoints.filter((e) => e.interesting).length} interesting endpoints`,
        40,
        y,
      );
      y += 24;

      doc.setFontSize(14);
      doc.text("JS Secrets", 40, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [["Severity", "Type", "File", "Line", "Preview"]],
        body: secrets
          .slice(0, 500)
          .map((s) => [s.severity, s.type, s.file, String(s.line), s.secretPreview]),
        styles: { fontSize: 7, cellPadding: 3 },
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 40, right: 40 },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const afterSecretsY = (doc as any).lastAutoTable?.finalY ?? y + 20;
      doc.setFontSize(14);
      doc.text("API Endpoints", 40, afterSecretsY + 24);
      autoTable(doc, {
        startY: afterSecretsY + 32,
        head: [["Severity", "Method", "Path", "Status", "Time (ms)", "Size"]],
        body: endpoints
          .filter((e) => e.interesting)
          .slice(0, 500)
          .map((e) => [
            e.severity,
            e.method,
            e.path,
            String(e.status),
            e.responseTimeMs.toFixed(0),
            String(e.sizeBytes),
          ]),
        styles: { fontSize: 7, cellPadding: 3 },
        headStyles: { fillColor: [6, 182, 212] },
        margin: { left: 40, right: 40 },
      });

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "For Authorized Penetration Testing Only",
        40,
        doc.internal.pageSize.getHeight() - 20,
      );

      doc.save(`apiripper-${jobId}.pdf`);
    } finally {
      setGeneratingPdf(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
            <FileText className="h-5 w-5" />
          </div>
          <CardTitle>PDF Report</CardTitle>
          <CardDescription>Branded report with charts summary and full findings tables.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handlePdfExport} disabled={generatingPdf} className="w-full">
            {generatingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {generatingPdf ? "Generating..." : "Download PDF"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <CardTitle>CSV Export</CardTitle>
          <CardDescription>Raw rows for both scanners, spreadsheet-ready.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleCsvExport} variant="secondary" className="w-full">
            <FileSpreadsheet className="h-4 w-4" /> Download CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
            <FileJson className="h-5 w-5" />
          </div>
          <CardTitle>JSON Export</CardTitle>
          <CardDescription>Full machine-readable job + findings payload.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleJsonExport} variant="secondary" className="w-full">
            <FileJson className="h-4 w-4" /> Download JSON
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
