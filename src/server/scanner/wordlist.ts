/**
 * wordlist.ts
 * --------------------------------------------------------------------------
 * Loads the API path wordlist (5000+ entries) from /wordlists/api_paths.txt
 * once per process and caches it in memory.
 */
import fs from "node:fs";
import path from "node:path";

let cachedPaths: string[] | null = null;

export function loadApiPaths(): string[] {
  if (cachedPaths) return cachedPaths;

  const wordlistPath = path.join(process.cwd(), "wordlists", "api_paths.txt");
  try {
    const raw = fs.readFileSync(wordlistPath, "utf-8");
    cachedPaths = raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"));
  } catch {
    // Fallback minimal list if the wordlist file is somehow missing.
    cachedPaths = [
      "users",
      "admin",
      "login",
      "config",
      "health",
      ".env",
      "swagger.json",
    ];
  }
  return cachedPaths;
}

export function wordlistCount(): number {
  return loadApiPaths().length;
}
