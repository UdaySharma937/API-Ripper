"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApiEndpointRow, JsSecretRow } from "@/lib/api";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#0ea5e9",
};

export function AnalyticsTab({
  secrets,
  endpoints,
}: {
  secrets: JsSecretRow[];
  endpoints: ApiEndpointRow[];
}) {
  const riskDonut = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const s of secrets) counts[s.severity] = (counts[s.severity] ?? 0) + 1;
    for (const e of endpoints) counts[e.severity] = (counts[e.severity] ?? 0) + 1;
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [secrets, endpoints]);

  const topPaths = useMemo(() => {
    return [...endpoints]
      .filter((e) => e.interesting)
      .sort((a, b) => {
        const rank = (s: string) => ({ critical: 3, high: 2, medium: 1, low: 0 })[s] ?? 0;
        return rank(b.severity) - rank(a.severity) || b.sizeBytes - a.sizeBytes;
      })
      .slice(0, 10)
      .map((e) => ({ path: e.path.length > 24 ? `${e.path.slice(0, 24)}…` : e.path, status: e.status }));
  }, [endpoints]);

  const timeline = useMemo(() => {
    const buckets = new Map<string, { time: string; secrets: number; endpoints: number }>();
    const bucketKey = (iso: string) => {
      const d = new Date(iso);
      d.setSeconds(0, 0);
      return d.toISOString();
    };
    for (const s of secrets) {
      const key = bucketKey(s.createdAt);
      const b = buckets.get(key) ?? { time: key, secrets: 0, endpoints: 0 };
      b.secrets += 1;
      buckets.set(key, b);
    }
    for (const e of endpoints) {
      const key = bucketKey(e.createdAt);
      const b = buckets.get(key) ?? { time: key, secrets: 0, endpoints: 0 };
      b.endpoints += 1;
      buckets.set(key, b);
    }
    return Array.from(buckets.values())
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((b) => ({ ...b, time: new Date(b.time).toLocaleTimeString() }));
  }, [secrets, endpoints]);

  const hasData = secrets.length > 0 || endpoints.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-white/10">
        <p className="text-sm">Charts will appear once findings start streaming in.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Risk Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={riskDonut} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                {riskDonut.map((entry) => (
                  <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] ?? "#64748b"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "none", borderRadius: 8, color: "#fff" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Vulnerable Paths</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {topPaths.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No interesting endpoints yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPaths} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="path" width={140} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "none", borderRadius: 8, color: "#fff" }} />
                <Bar dataKey="status" radius={[0, 6, 6, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Findings Timeline</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "none", borderRadius: 8, color: "#fff" }} />
              <Legend />
              <Line type="monotone" dataKey="secrets" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="endpoints" stroke="#06b6d4" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
