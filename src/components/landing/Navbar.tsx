"use client";

import Link from "next/link";
import { Code2, Terminal } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/landing/ThemeToggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-[#05060a]/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={30} />
          <span className="text-lg font-bold tracking-tight">
            API<span className="text-gradient">Ripper</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          <a href="#features" className="transition-colors hover:text-emerald-500">
            Features
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-emerald-500">
            How it works
          </a>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-500">
            <Terminal className="h-3 w-3" /> v1.0
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5 sm:flex"
            aria-label="Source"
          >
            <Code2 className="h-4 w-4" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
