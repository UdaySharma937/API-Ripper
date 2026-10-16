"use client";

import { motion } from "framer-motion";
import {
  KeyRound,
  Network,
  Gauge,
  Smartphone,
  FileDown,
  LineChart,
  Layers,
  ShieldHalf,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const FEATURES = [
  {
    icon: KeyRound,
    title: "JS Secret Scanner",
    desc: "Crawls scripts, inline blocks & sitemaps, then runs 80+ regex signatures to catch AWS, GCP, Azure, Stripe, GitHub, Firebase and more.",
  },
  {
    icon: Network,
    title: "API Endpoint Bruteforce",
    desc: "Fires a 12,000+ path wordlist against /api/, /api/v1/ and root prefixes with a bounded concurrent worker pool.",
  },
  {
    icon: Gauge,
    title: "Ultra Fast",
    desc: "Smart 404-skip heuristics and a concurrent worker pool keep scans fast without hammering the target unnecessarily.",
  },
  {
    icon: Layers,
    title: "Runs In Parallel",
    desc: "Both scanners share one orchestrator and run concurrently, so you get results from both engines simultaneously.",
  },
  {
    icon: LineChart,
    title: "Live Analytics",
    desc: "Risk donut charts, top vulnerable paths and scan timelines update live as findings stream in.",
  },
  {
    icon: FileDown,
    title: "1-Click Export",
    desc: "Export a branded PDF report, raw CSV, or JSON for every scan — ready to drop into your bug bounty submission.",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    desc: "Fully responsive from a 360px phone to a 4K monitor — virtualized tables stay smooth even with 50,000 rows.",
  },
  {
    icon: ShieldHalf,
    title: "Built-In Guardrails",
    desc: "SSRF protection blocks scans of private/internal networks so the tool can only be pointed at public targets.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Everything you need to recon fast</h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Two purpose-built scanners, one dashboard, zero wasted time.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
          >
            <Card className="h-full transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/5">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <f.icon className="h-5 w-5" />
                </div>
                <CardTitle>{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{f.desc}</CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
