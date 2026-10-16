"use client";

import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/landing/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import type { ScanLifecycle } from "@/lib/api";

function lifecycleVariant(status: ScanLifecycle) {
  switch (status) {
    case "completed":
      return "default" as const;
    case "failed":
      return "critical" as const;
    case "running":
      return "medium" as const;
    default:
      return "secondary" as const;
  }
}

export function DashboardHeader({
  targetUrl,
  status,
}: {
  targetUrl?: string;
  status?: ScanLifecycle;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-[#05060a]/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-emerald-500">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Logo size={26} />
          <div className="min-w-0">
            <p className="text-sm font-bold leading-none">
              API<span className="text-gradient">Ripper</span>
            </p>
            {targetUrl && (
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
                <Globe className="h-3 w-3 shrink-0" />
                <span className="truncate">{targetUrl}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status && <Badge variant={lifecycleVariant(status)}>{status}</Badge>}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
