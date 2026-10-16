import axios from "axios";

export const apiClient = axios.create({ baseURL: "/api" });

export type ScanLifecycle = "queued" | "running" | "completed" | "failed";
export type SubScanStatus = "queued" | "crawling" | "scanning" | "completed";
export type Severity = "critical" | "high" | "medium" | "low";

export interface ScanStatus {
  job_id: string;
  status: ScanLifecycle;
  error?: string | null;
  jsTotal: number;
  jsScanned: number;
  jsSecretsFound: number;
  jsStatus: SubScanStatus;
  apiTotal: number;
  apiScanned: number;
  apiFound: number;
  apiStatus: SubScanStatus;
}

export interface JsSecretRow {
  id: string;
  jobId: string;
  type: string;
  severity: Severity;
  secretPreview: string;
  file: string;
  line: number;
  createdAt: string;
}

export interface ApiEndpointRow {
  id: string;
  jobId: string;
  path: string;
  method: string;
  status: number;
  severity: Severity;
  responseTimeMs: number;
  sizeBytes: number;
  interesting: boolean;
  createdAt: string;
}

export interface ScanJobRecord {
  id: string;
  targetUrl: string;
  status: ScanLifecycle;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface ScanResults {
  job: ScanJobRecord;
  secrets: JsSecretRow[];
  endpoints: ApiEndpointRow[];
}

export async function startScan(targetUrl: string) {
  const res = await apiClient.post<{ job_id: string }>("/scan/start", { targetUrl });
  return res.data;
}

export async function getScanStatus(jobId: string) {
  const res = await apiClient.get<ScanStatus>(`/scan/${jobId}/status`);
  return res.data;
}

export async function getScanResults(jobId: string) {
  const res = await apiClient.get<ScanResults>(`/scan/${jobId}/results`);
  return res.data;
}

export function exportUrl(jobId: string, format: "json" | "csv", dataset: "all" | "secrets" | "endpoints" = "all") {
  return `/api/scan/${jobId}/export?format=${format}&dataset=${dataset}`;
}
