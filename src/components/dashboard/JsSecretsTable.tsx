"use client";

import { useMemo, useState, useCallback } from "react";
import { List, type RowComponentProps } from "react-window";
import { Check, Copy, KeyRound, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge, severityToVariant } from "@/components/ui/badge";
import type { JsSecretRow } from "@/lib/api";
import { useDebouncedValue, useMediaQuery } from "@/lib/hooks";
import { truncateMiddle } from "@/lib/utils";

const SEVERITIES = ["critical", "high", "medium", "low"] as const;

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard not available */
    }
  }, [value]);

  return (
    <button
      onClick={onCopy}
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
      aria-label="Copy secret preview"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

interface RowProps {
  rows: JsSecretRow[];
  isMobile: boolean;
}

function SecretRow({ index, style, rows, isMobile }: RowComponentProps<RowProps>) {
  const r = rows[index];
  if (!r) return null;

  if (isMobile) {
    return (
      <div style={style} className="px-1 pb-2">
        <div className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <Badge variant={severityToVariant(r.severity)}>{r.severity}</Badge>
            <CopyButton value={r.secretPreview} />
          </div>
          <p className="font-semibold">{r.type}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400" title={r.file}>
            {truncateMiddle(r.file, 48)} · L{r.line}
          </p>
          <code className="truncate rounded bg-slate-100 px-2 py-1 text-xs dark:bg-black/40">
            {r.secretPreview}
          </code>
        </div>
      </div>
    );
  }

  return (
    <div
      style={style}
      className="grid grid-cols-[110px_180px_1fr_1fr_44px] items-center gap-3 border-b border-slate-100 px-3 text-sm dark:border-white/5"
    >
      <Badge variant={severityToVariant(r.severity)}>{r.severity}</Badge>
      <span className="truncate font-medium">{r.type}</span>
      <span className="truncate text-slate-500 dark:text-slate-400" title={r.file}>
        {truncateMiddle(r.file, 60)}:{r.line}
      </span>
      <code className="truncate rounded bg-slate-100 px-2 py-1 text-xs dark:bg-black/40">
        {r.secretPreview}
      </code>
      <CopyButton value={r.secretPreview} />
    </div>
  );
}

export function JsSecretsTable({ rows }: { rows: JsSecretRow[] }) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 200);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return rows.filter((r) => {
      if (severityFilter && r.severity !== severityFilter) return false;
      if (!q) return true;
      return (
        r.type.toLowerCase().includes(q) ||
        r.file.toLowerCase().includes(q) ||
        r.secretPreview.toLowerCase().includes(q)
      );
    });
  }, [rows, debouncedSearch, severityFilter]);

  const rowHeight = isMobile ? 112 : 44;
  const listHeight = Math.min(600, Math.max(240, filtered.length * rowHeight));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search type, file, preview..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSeverityFilter(null)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              severityFilter === null
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                : "border-slate-300 text-slate-500 dark:border-white/15 dark:text-slate-400"
            }`}
          >
            All ({rows.length})
          </button>
          {SEVERITIES.map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s === severityFilter ? null : s)}
              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                severityFilter === s
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                  : "border-slate-300 text-slate-500 dark:border-white/15 dark:text-slate-400"
              }`}
            >
              {s} ({rows.filter((r) => r.severity === s).length})
            </button>
          ))}
        </div>
      </div>

      {!isMobile && filtered.length > 0 && (
        <div className="grid grid-cols-[110px_180px_1fr_1fr_44px] gap-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>Severity</span>
          <span>Type</span>
          <span>File : Line</span>
          <span>Preview</span>
          <span />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-400 dark:border-white/10">
          <KeyRound className="h-8 w-8" />
          <p className="text-sm">No secrets found{search || severityFilter ? " matching filters" : " yet"}.</p>
        </div>
      ) : (
        <List
          rowComponent={SecretRow}
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
