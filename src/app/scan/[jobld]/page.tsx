import { ScanDashboard } from "@/components/dashboard/ScanDashboard";

export default async function ScanPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <ScanDashboard jobId={jobId} />;
}
