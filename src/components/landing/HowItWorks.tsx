"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    step: "01",
    title: "Drop a target URL",
    desc: "Paste any publicly reachable site. APIRipper normalizes and validates the URL before launching.",
  },
  {
    step: "02",
    title: "Dual scanners launch in parallel",
    desc: "The crawler discovers JS files up to 3 levels deep while the API bruteforcer starts hammering the wordlist simultaneously.",
  },
  {
    step: "03",
    title: "Watch live progress",
    desc: "Two progress cards track each engine in real time with percentage bars, counts and streaming findings.",
  },
  {
    step: "04",
    title: "Export your report",
    desc: "Download a branded PDF, CSV or raw JSON the moment the scan completes — or mid-scan for a partial snapshot.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-slate-200/70 bg-slate-50/60 px-4 py-16 dark:border-white/10 dark:bg-white/[0.02] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">From URL to findings in four steps.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span className="text-3xl font-black text-emerald-500/30">{s.step}</span>
              <h3 className="mt-2 font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
