"use client";

import { useMemo, useState } from "react";
import { List, type RowComponentProps } from "react-window";
import { Globe2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge, severityToVariant } from "@/components/ui/badge";
import type { ApiEndpointRow } from "@/lib/api";
import { useDebouncedValue, useMediaQuery } from "@/lib/hooks";
import { formatBytes, formatMs } from "@/lib/utils";

const STATUS_FILTERS = [200, 403, 401, 500] as const;

function statusColor(status: number) {
  if (status === 0) return "text-slate-400";
  if (status >= 500) return "text-red-500";
  if (status === 403 || status === 401) return "text-amber-500";
  if (status >= 200 && status < 300) return "text-emerald-500";
  if (status >= 300 && status < 400) return "text-sky-500";
  return "text-slate-500";
}

interface RowProps {
  rows: ApiEndpointRow[];
  isMobile: boolean;
}

function EndpointRow({ index, style, rows, isMobile }: RowComponentProps<RowProps>) {
  const r = rows[index];
  if (!r) return null;

  if (isMobile) {
    return (
      <div style={style} className="px-1 pb-2">
        <div className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <Badge variant={severityToVariant(r.severity)}>{r.severity}</Badge>
            <span className={`font-mono text-sm font-bold ${statusColor(r.status)}`}>
              {r.status || "ERR"}
            </span>
          </div>
          <p className="truncate font-mono text-sm font-semibold">{r.path}</p>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{r.method}</span>
            <span>{formatMs(r.responseTimeMs)}</span>
            <span>{formatBytes(r.sizeBytes)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={style}
      className="grid grid-cols-[100px_90px_1fr_90px_100px_90px] items-center gap-3 border-b border-slate-100 px-3 text-sm dark:border-white/5"
    >
      <Badge variant={severityToVariant(r.severity)}>{r.severity}</Badge>
      <span className="font-mono text-xs font-semibold">{r.method}</span>
      <span className="truncate font-mono" title={r.path}>
        {r.path}
      </span>
      <span className={`font-mono font-bold ${statusColor(r.status)}`}>{r.status || "ERR"}</span>
      <span className="text-slate-500 dark:text-slate-400">{formatMs(r.responseTimeMs)}</span>
      <span className="text-slate-500 dark:text-slate-400">{formatBytes(r.sizeBytes)}</span>
    </div>
  );
}

export function ApiEndpointsTable({ rows }: { rows: ApiEndpointRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const debouncedSearch = useDebouncedValue(search, 200);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== null && r.status !== statusFilter) return false;
      if (!q) return true;
      return r.path.toLowerCase().includes(q) || r.method.toLowerCase().includes(q);
    });
  }, [rows, debouncedSearch, statusFilter]);

  const rowHeight = isMobile ? 104 : 42;
  const listHeight = Math.min(600, Math.max(240, filtered.length * rowHeight));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search path or method..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setStatusFilter(null)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === null
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                : "border-slate-300 text-slate-500 dark:border-white/15 dark:text-slate-400"
            }`}
          >
            All ({rows.length})
          </button>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s === statusFilter ? null : s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                  : "border-slate-300 text-slate-500 dark:border-white/15 dark:text-slate-400"
              }`}
            >
              {s} ({rows.filter((r) => r.status === s).length})
            </button>
          ))}
        </div>
      </div>

      {!isMobile && filtered.length > 0 && (
        <div className="grid grid-cols-[100px_90px_1fr_90px_100px_90px] gap-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>Severity</span>
          <span>Method</span>
          <span>Path</span>
          <span>Status</span>
          <span>Time</span>
          <span>Size</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-white/10">
          <Globe2 className="h-8 w-8" />
          <p className="text-sm">
            No interesting endpoints found{search || statusFilter ? " matching filters" : " yet"}.
          </p>
        </div>
      ) : (
        <List
          rowComponent={EndpointRow}
          rowCount={filtered.length}
          rowHeight={rowHeight}
          rowProps={{ rows: filtered, isMobile }}
          style={{ height: listHeight, width: "100%" }}
          className="rounded-xl"
        />
      )}
    </div>
  );
}
