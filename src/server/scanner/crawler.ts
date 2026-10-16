/**
 * crawler.ts
 * --------------------------------------------------------------------------
 * Unlimited JS file discovery.
 * - Crawls the target site and follows internal links up to 3 levels deep.
 * - Collects JS referenced via <script src="">, inline <script> blocks
 *   (scanned directly), and JS URLs discovered inside sitemap.xml.
 * - Implemented with a FIFO queue (equivalent to asyncio.Queue) + a bounded
 *   worker pool for parallel fetching.
 */
import * as cheerio from "cheerio";

export interface InlineScript {
  url: string; // synthetic identifier, e.g. "https://site.com/ (inline #2)"
  content: string;
}

export interface CrawlResult {
  jsUrls: Set<string>;
  inlineScripts: InlineScript[];
  pagesVisited: number;
}

const MAX_DEPTH = 3;
const MAX_PAGES = 60; // safety cap so "unlimited" crawling can't run forever
const FETCH_TIMEOUT_MS = 8000;
const CONCURRENCY = 10;

const UA = "APIRipper/1.0 (+authorized-security-testing)";

async function fetchText(url: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: signal ?? controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function toAbsolute(base: string, href: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

async function discoverFromSitemap(origin: string): Promise<string[]> {
  const found: string[] = [];
  const candidates = [`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`];
  for (const sitemapUrl of candidates) {
    const xml = await fetchText(sitemapUrl);
    if (!xml) continue;
    const $ = cheerio.load(xml, { xmlMode: true });
    $("loc").each((_, el) => {
      const loc = $(el).text().trim();
      if (loc.toLowerCase().endsWith(".js")) found.push(loc);
    });
  }
  return found;
}

/**
 * BFS crawl of the target site up to MAX_DEPTH, collecting JS file URLs
 * and inline script contents along the way.
 */
export async function crawlSite(
  targetUrl: string,
  onJsFound?: (url: string) => void,
): Promise<CrawlResult> {
  const startUrl = new URL(targetUrl);
  const origin = startUrl.origin;

  const jsUrls = new Set<string>();
  const inlineScripts: InlineScript[] = [];
  const visited = new Set<string>();

  type QueueItem = { url: string; depth: number };
  const queue: QueueItem[] = [{ url: startUrl.toString(), depth: 0 }];
  let pagesVisited = 0;

  // Sitemap based discovery runs independently of the BFS crawl.
  const sitemapJs = await discoverFromSitemap(origin);
  for (const js of sitemapJs) {
    if (!jsUrls.has(js)) {
      jsUrls.add(js);
      onJsFound?.(js);
    }
  }

  async function worker() {
    while (queue.length > 0 && pagesVisited < MAX_PAGES) {
      const item = queue.shift();
      if (!item) return;
      const { url, depth } = item;
      if (visited.has(url)) continue;
      visited.add(url);
      pagesVisited++;

      const html = await fetchText(url);
      if (!html) continue;

      const $ = cheerio.load(html);

      // <script src="...">
      $("script[src]").each((_, el) => {
        const src = $(el).attr("src");
        if (!src) return;
        const abs = toAbsolute(url, src);
        if (abs && abs.split("?")[0].toLowerCase().endsWith(".js")) {
          if (!jsUrls.has(abs)) {
            jsUrls.add(abs);
            onJsFound?.(abs);
          }
        } else if (abs && abs.toLowerCase().includes(".js")) {
          // JS served without a clean extension but src hints JS (e.g. chunk?v=)
          if (!jsUrls.has(abs)) {
            jsUrls.add(abs);
            onJsFound?.(abs);
          }
        }
      });

      // Inline <script> blocks (no src) - scanned directly for secrets.
      let inlineIdx = 0;
      $("script:not([src])").each((_, el) => {
        const content = $(el).html();
        if (content && content.trim().length > 20) {
          inlineIdx++;
          inlineScripts.push({ url: `${url} (inline #${inlineIdx})`, content });
        }
      });

      // Follow internal links for further discovery, up to MAX_DEPTH.
      if (depth < MAX_DEPTH) {
        $("a[href]").each((_, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          const abs = toAbsolute(url, href);
          if (!abs) return;
          try {
            const u = new URL(abs);
            if (u.origin === origin && !visited.has(u.toString())) {
              queue.push({ url: u.toString(), depth: depth + 1 });
            }
          } catch {
            /* ignore malformed */
          }
        });
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  return { jsUrls, inlineScripts, pagesVisited };
}
