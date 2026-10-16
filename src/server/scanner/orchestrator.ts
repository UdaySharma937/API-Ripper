/**
 * orchestrator.ts
 * --------------------------------------------------------------------------
 * Runs the JS Secret Scanner and API Endpoint Scanner in parallel
 * (asyncio.gather equivalent: Promise.all) and streams progress into the
 * job manager, which mirrors it to Postgres for polling clients.
 */
import { crawlSite } from "./crawler";
import { runJsScanner } from "./jsScanner";
import { runApiScanner } from "./apiScanner";
import { loadApiPaths } from "./wordlist";
import { assertPublicHttpUrl } from "./ssrfGuard";
import {
  bufferApiFinding,
  bufferSecret,
  flushAll,
  initLiveJob,
  patchProgress,
} from "../jobManager";

export async function runScan(jobId: string, targetUrl: string): Promise<void> {
  initLiveJob(jobId);
  try {
    const url = await assertPublicHttpUrl(targetUrl);
    await patchProgress(
      jobId,
      { status: "running", jsStatus: "crawling", apiStatus: "queued" },
      true,
    );

    // ---- Phase 1: crawl the site to discover JS files (unlimited, 3 levels deep) ----
    let jsDiscovered = 0;
    const crawlResult = await crawlSite(url.toString(), () => {
      jsDiscovered++;
      void patchProgress(jobId, { jsTotal: jsDiscovered });
    });

    const jsUrls = Array.from(crawlResult.jsUrls);
    const apiPaths = loadApiPaths();

    await patchProgress(
      jobId,
      {
        jsTotal: jsUrls.length + crawlResult.inlineScripts.length,
        jsStatus: "scanning",
        apiTotal: apiPaths.length * 3, // 3 prefixes tested per path
        apiStatus: "scanning",
      },
      true,
    );

    // ---- Phase 2: run JS secret scanner + API bruteforce scanner in parallel ----
    const progressState = { jsScanned: 0, jsSecretsFound: 0, apiFound: 0 };

    const jsTask = runJsScanner(jsUrls, crawlResult.inlineScripts, {
      onFileScanned: (_url, _count) => {
        const progress = {
          jsScanned: (progressState.jsScanned += 1),
        };
        void patchProgress(jobId, progress);
      },
      onSecretFound: (finding) => {
        progressState.jsSecretsFound += 1;
        bufferSecret(jobId, finding);
        void patchProgress(jobId, { jsSecretsFound: progressState.jsSecretsFound });
      },
    });

    const apiTask = runApiScanner(url.toString(), apiPaths, {
      onPathTested: (_finding, scannedCount) => {
        void patchProgress(jobId, { apiScanned: scannedCount });
      },
      onEndpointFound: (finding) => {
        progressState.apiFound += 1;
        bufferApiFinding(jobId, finding);
        void patchProgress(jobId, { apiFound: progressState.apiFound });
      },
    });

    await Promise.all([jsTask, apiTask]);

    await flushAll(jobId);
    await patchProgress(
      jobId,
      {
        status: "completed",
        jsStatus: "completed",
        apiStatus: "completed",
      },
      true,
    );
  } catch (err) {
    await flushAll(jobId).catch(() => undefined);
    const message = err instanceof Error ? err.message : "Unknown scan error";
    await patchProgress(jobId, { status: "failed", error: message }, true);
  }
}
