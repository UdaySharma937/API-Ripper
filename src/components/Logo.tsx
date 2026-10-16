import { cn } from "@/lib/utils";

/**
 * Inline APIRipper logo (also exported as a static asset at /public/logo.svg)
 * so it can be colored/animated via currentColor-friendly gradients without
 * an extra network request.
 */
export function Logo({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="apiripperGradInline" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <path
        d="M32 2 L58 14 V32 C58 46 47 56 32 62 C17 56 6 46 6 32 V14 Z"
        fill="url(#apiripperGradInline)"
        opacity="0.15"
        stroke="url(#apiripperGradInline)"
        strokeWidth="2"
      />
      <path
        d="M26 16 L18 32 L26 32 L22 48 L46 28 L34 28 L40 16 Z"
        fill="url(#apiripperGradInline)"
      />
      <circle cx="32" cy="32" r="29" stroke="url(#apiripperGradInline)" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}
