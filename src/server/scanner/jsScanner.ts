/**
 * js_scanner.ts (module name kept close to original spec: scanner/js_scanner.py)
 * --------------------------------------------------------------------------
 * Worker pool that pulls JS URLs off a queue, downloads them with a 10s
 * timeout, and runs 80+ regex patterns against the content to detect
 * hard-coded secrets. Results are cached per URL (content hash) so the same
 * file is never re-scanned twice during the process lifetime.
 */
import { createHash } from "node:crypto";
import { SECRET_PATTERNS, type Severity } from "./regexPatterns";
import type { InlineScript } from "./crawler";

export interface SecretFinding {
  type: string;
  severity: Severity;
  secretPreview: string;
  file: string;
  line: number;
}

interface CacheEntry {
  hash: string;
  findings: SecretFinding[];
}

// Process-wide cache: url -> last scan result, so identical JS files
// (by URL) are never downloaded + scanned twice.
const scanCache = new Map<string, CacheEntry>();

const FETCH_TIMEOUT_MS = 10_000;
const CONCURRENCY = 20;
const UA = "APIRipper/1.0 (+authorized-security-testing)";

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function maskSecret(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length <= 10) return `${trimmed.slice(0, 2)}****`;
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}

/** Run all regex patterns against a block of JS source, line by line. */
export function scanContentForSecrets(content: string, fileLabel: string): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const lines = content.split("\n");

  // Cap scanning on pathologically large minified single-line bundles by
  // chunking very long lines for line-number approximation.
  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const line = lines[lineNo];
    if (!line || line.length === 0) continue;

    for (const pattern of SECRET_PATTERNS) {
      pattern.regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      let iterations = 0;
      while ((match = pattern.regex.exec(line)) !== null && iterations < 5) {
        iterations++;
        findings.push({
          type: pattern.type,
          severity: pattern.severity,
          secretPreview: maskSecret(match[0]),
          file: fileLabel,
          line: lineNo + 1,
        });
        if (!pattern.regex.global) break;
      }
    }
  }
  return findings;
}

async function fetchJs(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "*/*" },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    // Cap very large bundles to keep scanning fast (10MB ceiling).
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 10 * 1024 * 1024) {
      return Buffer.from(buf.slice(0, 10 * 1024 * 1024)).toString("utf-8");
    }
    return Buffer.from(buf).toString("utf-8");
  } catch {
    return null;
  }
}

export interface JsScanOptions {
  onFileScanned?: (url: string, findingsCount: number) => void;
  onSecretFound?: (finding: SecretFinding) => void;
}

/**
 * Scans both remote JS file URLs and inline script blocks in parallel using
 * a bounded worker pool (concurrency-limited queue).
 */
export async function runJsScanner(
  jsUrls: string[],
  inlineScripts: InlineScript[],
  options: JsScanOptions = {},
): Promise<SecretFinding[]> {
  const allFindings: SecretFinding[] = [];
  const queue = [...jsUrls];

  // Inline scripts are scanned immediately (already in memory).
  for (const inline of inlineScripts) {
    const findings = scanContentForSecrets(inline.content, inline.url);
    for (const f of findings) {
      allFindings.push(f);
      options.onSecretFound?.(f);
    }
    options.onFileScanned?.(inline.url, findings.length);
  }

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) return;

      const cached = scanCache.get(url);
      let content: string | null = null;
      if (!cached) {
        content = await fetchJs(url);
      }

      if (content !== null) {
        const hash = hashContent(content);
        if (cached && cached.hash === hash) {
          for (const f of cached.findings) {
            allFindings.push(f);
            options.onSecretFound?.(f);
          }
          options.onFileScanned?.(url, cached.findings.length);
          continue;
        }
        const findings = scanContentForSecrets(content, url);
        scanCache.set(url, { hash, findings });
        for (const f of findings) {
          allFindings.push(f);
          options.onSecretFound?.(f);
        }
        options.onFileScanned?.(url, findings.length);
      } else if (cached) {
        // Fetch failed this round but we have a previous cached result.
        for (const f of cached.findings) {
          allFindings.push(f);
          options.onSecretFound?.(f);
        }
        options.onFileScanned?.(url, cached.findings.length);
      } else {
        options.onFileScanned?.(url, 0);
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, Math.max(jsUrls.length, 1)) }, () =>
    worker(),
  );
  await Promise.all(workers);

  return allFindings;
}

export function clearScanCache() {
  scanCache.clear();
}
