"use client";

import { motion } from "framer-motion";
import { Zap, Radar, ShieldCheck } from "lucide-react";
import { ScanForm } from "@/components/landing/ScanForm";

export function Hero() {
  return (
    <section className="grid-bg relative overflow-hidden border-b border-slate-200/70 dark:border-white/10">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent" />
      <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-500"
        >
          <span className="relative flex h-2 w-2">
            <span className="pulse-ring absolute inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Dual-engine parallel scanning
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-[clamp(2rem,6vw,3.75rem)] font-extrabold leading-[1.05] tracking-tight"
        >
          Rip open any attack
          <br />
          <span className="text-gradient">surface in seconds.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mx-auto mt-5 max-w-2xl text-balance text-base text-slate-600 dark:text-slate-400 sm:text-lg"
        >
          APIRipper hunts leaked secrets across every JavaScript bundle and bruteforces thousands
          of hidden API paths in parallel — built for bug bounty hunters who need speed.
        </motion.p>

        <ScanForm />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-10 flex max-w-xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-500 dark:text-slate-400"
        >
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-emerald-500" /> 80+ secret signatures
          </span>
          <span className="flex items-center gap-1.5">
            <Radar className="h-3.5 w-3.5 text-emerald-500" /> 12,000+ path wordlist
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Authorized testing only
          </span>
        </motion.div>
      </div>
    </section>
  );
}
