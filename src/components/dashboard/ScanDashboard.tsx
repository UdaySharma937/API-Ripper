"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, Network } from "lucide-react";
import { getScanStatus, getScanResults } from "@/lib/api";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JsSecretsTable } from "@/components/dashboard/JsSecretsTable";
import { ApiEndpointsTable } from "@/components/dashboard/ApiEndpointsTable";
import { ExportTab } from "@/components/dashboard/ExportTab";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Footer } from "@/components/Footer";

// Charts are heavy; lazy-load them so the first paint of the dashboard
// (progress cards + tables) stays fast.
const AnalyticsTab = dynamic(
  () => import("@/components/dashboard/AnalyticsTab").then((m) => m.AnalyticsTab),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    ),
  },
);

export function ScanDashboard({ jobId }: { jobId: string }) {
  const statusQuery = useQuery({
    queryKey: ["scan-status", jobId],
    queryFn: () => getScanStatus(jobId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 1000;
      return data.status === "completed" || data.status === "failed" ? false : 1000;
    },
  });

  const isDone = statusQuery.data?.status === "completed" || statusQuery.data?.status === "failed";

  const resultsQuery = useQuery({
    queryKey: ["scan-results", jobId],
    queryFn: () => getScanResults(jobId),
    refetchInterval: isDone ? false : 1500,
  });

  const status = statusQuery.data;
  const secrets = resultsQuery.data?.secrets ?? [];
  const endpoints = resultsQuery.data?.endpoints ?? [];
  const interestingEndpoints = endpoints.filter((e) => e.interesting);

  return (
    <main className="flex min-h-screen flex-col">
      <DashboardHeader targetUrl={resultsQuery.data?.job.targetUrl} status={status?.status} />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {statusQuery.isLoading && !status ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        ) : statusQuery.isError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center text-red-400">
            Failed to load scan status. The job may not exist.
          </div>
        ) : (
          <>
            {status?.status === "failed" && status.error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
                Scan failed: {status.error}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ErrorBoundary fallbackTitle="Couldn't render JS scanner progress">
                <ProgressCard
                  icon={KeyRound}
                  title="JS Secret Scanner"
                  status={status?.jsStatus ?? "queued"}
                  current={status?.jsScanned ?? 0}
                  total={status?.jsTotal ?? 0}
                  foundCount={status?.jsSecretsFound ?? 0}
                  foundLabel="Secrets found"
                  accent="emerald"
                />
              </ErrorBoundary>
              <ErrorBoundary fallbackTitle="Couldn't render API scanner progress">
                <ProgressCard
                  icon={Network}
                  title="API Endpoint Scanner"
                  status={status?.apiStatus ?? "queued"}
                  current={status?.apiScanned ?? 0}
                  total={status?.apiTotal ?? 0}
                  foundCount={status?.apiFound ?? 0}
                  foundLabel="Interesting endpoints"
                  accent="cyan"
                />
              </ErrorBoundary>
            </div>

            <Tabs defaultValue="secrets" className="mt-6">
              <TabsList>
                <TabsTrigger value="secrets">JS Secrets ({secrets.length})</TabsTrigger>
                <TabsTrigger value="endpoints">API Endpoints ({interestingEndpoints.length})</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="secrets">
                <ErrorBoundary fallbackTitle="Couldn't render secrets table">
                  {resultsQuery.isLoading && !resultsQuery.data ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <JsSecretsTable rows={secrets} />
                  )}
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="endpoints">
                <ErrorBoundary fallbackTitle="Couldn't render endpoints table">
                  {resultsQuery.isLoading && !resultsQuery.data ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <ApiEndpointsTable rows={interestingEndpoints} />
                  )}
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="analytics">
                <ErrorBoundary fallbackTitle="Couldn't render analytics">
                  <AnalyticsTab secrets={secrets} endpoints={endpoints} />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="export">
                <ErrorBoundary fallbackTitle="Couldn't render export panel">
                  <ExportTab jobId={jobId} job={resultsQuery.data?.job} secrets={secrets} endpoints={endpoints} />
                </ErrorBoundary>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
