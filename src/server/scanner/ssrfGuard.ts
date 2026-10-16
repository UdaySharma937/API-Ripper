/**
 * ssrfGuard.ts
 * --------------------------------------------------------------------------
 * Minimal SSRF protection. Since APIRipper accepts arbitrary attacker-chosen
 * target URLs and fetches them server-side, we block requests aimed at
 * private / loopback / link-local networks and non-http(s) schemes.
 */
import dns from "node:dns/promises";
import net from "node:net";

const PRIVATE_V4_RANGES: Array<[string, number]> = [
  ["10.0.0.0", 8],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16],
  ["100.64.0.0", 10],
  ["0.0.0.0", 8],
];

function ipToLong(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isPrivateV4(ip: string): boolean {
  const ipLong = ipToLong(ip);
  return PRIVATE_V4_RANGES.some(([base, bits]) => {
    const baseLong = ipToLong(base);
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (ipLong & mask) === (baseLong & mask);
  });
}

function isPrivateV6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80")
  );
}

export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL provided.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http/https URLs are supported.");
  }

  const hostname = url.hostname;

  if (net.isIP(hostname)) {
    if (net.isIP(hostname) === 4 && isPrivateV4(hostname)) {
      throw new Error("Scanning private/internal IP ranges is not allowed.");
    }
    if (net.isIP(hostname) === 6 && isPrivateV6(hostname)) {
      throw new Error("Scanning private/internal IP ranges is not allowed.");
    }
    return url;
  }

  if (hostname === "localhost" || hostname.endsWith(".local")) {
    throw new Error("Scanning localhost is not allowed.");
  }

  try {
    const records = await dns.lookup(hostname, { all: true });
    for (const rec of records) {
      if (rec.family === 4 && isPrivateV4(rec.address)) {
        throw new Error("Target resolves to a private IP address.");
      }
      if (rec.family === 6 && isPrivateV6(rec.address)) {
        throw new Error("Target resolves to a private IP address.");
      }
    }
  } catch {
    // If DNS resolution fails here we let the actual scan surface the error.
  }

  return url;
}
