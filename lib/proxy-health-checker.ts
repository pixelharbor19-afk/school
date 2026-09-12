import { fetchWithTimeout } from "@/lib/fetch-timeout";

export const workerProxies = [
  "https://shy-rice-3f7d.gmail1.workers.dev/",
  "https://tiny-night-3f17.gmail3.workers.dev/",
  "https://damp-resonance-edc1.facebook1.workers.dev/",
  "https://round-term-b231.facebook2-891.workers.dev/",
  "https://dry-morning-c50d.facebook3.workers.dev/",
  "https://flat-resonance-2702.facebook4.workers.dev/",
  "https://aged-thunder-925d.facebook5.workers.dev/",
  "https://throbbing-thunder-2359.facebook6.workers.dev/",
  "https://quiet-heart-aaca.facebook7.workers.dev/",
  "https://fancy-math-b578.facebook8.workers.dev/",
  "https://square-fog-9d75.facebook9.workers.dev/",
  "https://steep-fog-c825.facebook10.workers.dev/",
  "https://crimson-sky-185f.facebook11.workers.dev/",
  "https://winter-wind-3b69.facebook12.workers.dev/",
  "https://hidden-breeze-2e88.facebook13.workers.dev/",
  "https://plain-waterfall-fe4e.facebook14.workers.dev/",
  "https://tight-king-45e5.facebook15.workers.dev/",
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
