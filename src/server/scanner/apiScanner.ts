/**
 * api_scanner.ts (module name kept close to original spec: scanner/api_scanner.py)
 * --------------------------------------------------------------------------
 * Bruteforces API paths against a target using a bounded concurrent worker
 * pool (Semaphore-equivalent). Loads 5000+ candidate paths from
 * /wordlists/api_paths.txt and tests each against three prefixes:
 *   /api/{path}, /api/v1/{path}, /{path}
 *
 * Smart-skip: once a given prefix returns 20 consecutive 404s, remaining
 * untested paths for that prefix are fast-skipped (server clearly doesn't
 * route that prefix) to save time - mirroring the spec's requirement.
 */
import type { Severity } from "./regexPatterns";

export interface ApiFinding {
  path: string;
  method: string;
  status: number;
  severity: Severity;
  responseTimeMs: number;
  sizeBytes: number;
  interesting: boolean;
}

const PREFIXES = ["api/", "api/v1/", ""];
const CONCURRENCY = 60; // bounded worker pool (sandbox-safe substitute for Semaphore(300))
const TIMEOUT_MS = 6000;
const CONSECUTIVE_404_LIMIT = 20;
const UA = "APIRipper/1.0 (+authorized-security-testing)";

const SENSITIVE_HINTS = [
  ".env",
  "config",
  "secret",
  "backup",
  "credential",
  "swagger",
  "actuator",
  "wp-admin",
  ".git",
  "admin",
  "id_rsa",
  "dump.sql",
  ".aws",
  "debug",
  "private",
  "internal",
  "database",
];

function classifySeverity(status: number, path: string): { severity: Severity; interesting: boolean } {
  const lowerPath = path.toLowerCase();
  const isSensitive = SENSITIVE_HINTS.some((h) => lowerPath.includes(h));

  if (status === 200) {
    return { severity: isSensitive ? "critical" : "medium", interesting: true };
  }
  if (status === 401 || status === 403) {
    return { severity: isSensitive ? "high" : "low", interesting: isSensitive };
  }
  if (status >= 500) {
    return { severity: "medium", interesting: true };
  }
  if (status >= 300 && status < 400) {
    return { severity: "low", interesting: false };
  }
  return { severity: "low", interesting: false };
}

export interface ApiScanOptions {
  onPathTested?: (finding: ApiFinding, scannedCount: number) => void;
  onEndpointFound?: (finding: ApiFinding) => void;
  /** Invoked once with the real (deduplicated) number of requests to be made. */
  onTotalReady?: (total: number) => void;
}

interface Task {
  path: string;
  prefix: string;
  url: string;
}

export async function runApiScanner(
  targetUrl: string,
  paths: string[],
  options: ApiScanOptions = {},
): Promise<ApiFinding[]> {
  const origin = new URL(targetUrl).origin;
  const findings: ApiFinding[] = [];

  const tasks: Task[] = [];
  const seenUrls = new Set<string>();
  for (const prefix of PREFIXES) {
    for (const p of paths) {
      const cleanPath = p.replace(/^\/+/, "");
      const url = `${origin}/${prefix}${cleanPath}`;
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
      tasks.push({ path: cleanPath, prefix, url });
    }
  }

  const total = tasks.length;
  let scanned = 0;

  // Per-prefix state for smart 404 skipping.
  const consecutive404: Record<string, number> = {};
  const prefixSkipped: Record<string, boolean> = {};
  for (const prefix of PREFIXES) {
    consecutive404[prefix] = 0;
    prefixSkipped[prefix] = false;
  }

  const queue = [...tasks];

  async function testOne(task: Task): Promise<void> {
    if (prefixSkipped[task.prefix]) {
      scanned++;
      options.onPathTested?.(
        {
          path: task.path,
          method: "GET",
          status: 0,
          severity: "low",
          responseTimeMs: 0,
          sizeBytes: 0,
          interesting: false,
        },
        scanned,
      );
      return;
    }

    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(task.url, {
        method: "GET",
        headers: { "User-Agent": UA, Accept: "application/json,*/*" },
        signal: controller.signal,
        redirect: "manual",
      });
      clearTimeout(timeout);
      const elapsed = performance.now() - start;

      let size = Number(res.headers.get("content-length") ?? 0);
      if (!size) {
        try {
          const buf = await res.arrayBuffer();
          size = buf.byteLength;
        } catch {
          size = 0;
        }
      }

      const status = res.status;
      const { severity, interesting } = classifySeverity(status, task.path);
      const finding: ApiFinding = {
        path: `/${task.prefix}${task.path}`,
        method: "GET",
        status,
        severity,
        responseTimeMs: elapsed,
        sizeBytes: size,
        interesting,
      };

      if (status === 404) {
        consecutive404[task.prefix]++;
        if (consecutive404[task.prefix] >= CONSECUTIVE_404_LIMIT) {
          prefixSkipped[task.prefix] = true;
        }
      } else {
        consecutive404[task.prefix] = 0;
      }

      scanned++;
      options.onPathTested?.(finding, scanned);
      if (interesting || status !== 404) {
        findings.push(finding);
        if (interesting) options.onEndpointFound?.(finding);
      }
    } catch {
      scanned++;
      const finding: ApiFinding = {
        path: `/${task.prefix}${task.path}`,
        method: "GET",
        status: 0,
        severity: "low",
        responseTimeMs: performance.now() - start,
        sizeBytes: 0,
        interesting: false,
      };
      options.onPathTested?.(finding, scanned);
    }
  }

  async function worker() {
    while (queue.length > 0) {
      const task = queue.shift();
      if (!task) return;
      await testOne(task);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, total || 1) }, () => worker());
  await Promise.all(workers);

  return findings;
}
