import { fetchWithTimeout } from "@/lib/fetch-timeout";

export const workerProxies = [
  "https://shy-rice-3f7d.gmail1.workers.dev/",
  " https://tiny-night-3f17.gmail3.workers.dev/",
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
}

export async function workerProxyHealth(proxies: string[]) {
  const shuffledProxies = shuffle(proxies);

  for (const proxy of shuffledProxies) {
    try {
      const res = await fetchWithTimeout(
        proxy,
        { method: "HEAD", headers: { Range: "bytes=0-1" } },
        7000,
      );

      if (res.ok) return proxy;
    } catch (err: any) {
      console.error(
        `[PROXY] ${proxy} → ${err?.name || err?.message || "failed"}`,
      );
    }
  }

  return null;
}
