"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Search, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { startScan } from "@/lib/api";

export function ScanForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) {
      setError("Enter a target URL to scan.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { job_id } = await startScan(url.trim());
      router.push(`/scan/${job_id}`);
    } catch (err) {
      const axiosMessage =
        err && typeof err === "object" && "response" in err
          ? // @ts-expect-error axios error shape
            err.response?.data?.error
          : null;
      setError(axiosMessage ?? "Failed to start scan. Check the URL and try again.");
      setLoading(false);
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mx-auto mt-8 w-full max-w-2xl"
    >
      <div className="glass-panel flex flex-col gap-2 rounded-2xl p-2 shadow-xl shadow-emerald-500/5 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 px-2">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://target-app.com"
            className="h-12 border-none bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
            disabled={loading}
          />
        </div>
        <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
          {loading ? "Launching scan..." : "Start Scan"}
        </Button>
      </div>
      {error && <p className="mt-2 text-center text-sm text-red-400 sm:text-left">{error}</p>}
      <p className="mt-3 text-center text-xs text-slate-500 sm:text-left">
        By starting a scan you confirm you are authorized to test this target.
      </p>
    </motion.form>
  );
}
