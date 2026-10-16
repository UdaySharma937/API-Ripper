"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProgressCardProps {
  icon: LucideIcon;
  title: string;
  status: string;
  current: number;
  total: number;
  foundCount: number;
  foundLabel: string;
  accent: "emerald" | "cyan";
}

export function ProgressCard({
  icon: Icon,
  title,
  status,
  current,
  total,
  foundCount,
  foundLabel,
  accent,
}: ProgressCardProps) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : status === "completed" ? 100 : 0;
  const isDone = status === "completed";
  const isActive = status === "crawling" || status === "scanning";

  return (
    <Card className="relative overflow-hidden">
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl opacity-20",
          accent === "emerald" ? "bg-emerald-400" : "bg-cyan-400",
        )}
      />
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              accent === "emerald" ? "bg-emerald-500/10 text-emerald-500" : "bg-cyan-500/10 text-cyan-500",
            )}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
        <Badge variant={isDone ? "default" : isActive ? "medium" : "secondary"}>
          {isActive && (
            <span className="relative mr-1 inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
            </span>
          )}
          {status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <motion.span
            key={pct}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className="text-3xl font-bold tabular-nums"
          >
            {pct}%
          </motion.span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {current.toLocaleString()} / {total.toLocaleString() || "…"}
          </span>
        </div>
        <Progress value={pct} className="mt-3" />
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">{foundLabel}</span>
          <span className={cn("font-semibold", foundCount > 0 ? "text-amber-500" : "text-slate-400")}>
            {foundCount.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
