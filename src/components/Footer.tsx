import { Logo } from "@/components/Logo";
import { ShieldAlert } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200/70 px-4 py-10 dark:border-white/10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <Logo size={22} />
          <span className="text-sm font-semibold">
            API<span className="text-gradient">Ripper</span>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          <ShieldAlert className="h-3.5 w-3.5" />
          For Authorized Penetration Testing Only
        </div>
        <p className="text-xs text-slate-500">© {new Date().getFullYear()} APIRipper. All rights reserved.</p>
      </div>
    </footer>
  );
}
