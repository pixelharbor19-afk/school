import { NextRequest } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { workerProxies, workerProxyHealth } from "@/lib/proxy-health-checker";
import { encryptUrl } from "@/lib/aes-encryptor";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  const tmdbId = req.nextUrl.searchParams.get("id");
  const mediaType = req.nextUrl.searchParams.get("mediaType");
  const season = req.nextUrl.searchParams.get("season") || "1";
  const episode = req.nextUrl.searchParams.get("episode") || "1";

  if (!target || !tmdbId || !mediaType) {
    return new Response("Missing parameters", { status: 400 });
  }

  const url = new URL(target);
  const embedId = url.pathname.split("/")[2];
  const type = url.pathname.startsWith("/pl/") ? "pl" : "streamsvr";

  const cacheKey =
    mediaType === "movie"
      ? `movie-${tmdbId}-${type}`
      : `tv-${tmdbId}-s${season}-e${episode}-${type}`;

  const cacheFile = path.join("/apps/cache", cacheKey, "playlist.m3u8");
  const domain = "https://vidstuck.xyz";

  try {
    let originalPlaylist: string | null = null;

    try {
      const cached = await readFile(cacheFile, "utf8");

      if (cached.includes("#EXTM3U")) {
        originalPlaylist = cached;
      }
    } catch {}

    if (!originalPlaylist) {
      const { stdout } = await execFileAsync("curl", [
        "-sS",
        "--compressed",
        url.toString(),
        "-H",
        "Accept: */*",
        "-H",
        "Origin: https://goodstream.cc",
        "-H",
        `Referer: https://goodstream.cc/embed/${embedId}`,
        "-H",
        `User-Agent: ${USER_AGENT}`,
      ]);

      originalPlaylist = stdout;
    }

    const segmentWorkerProxy = await workerProxyHealth(workerProxies);

    let playlist = originalPlaylist;

    const nestedUrls = playlist
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.startsWith("https://goodstream.cc/") ||
          line.startsWith("https://www.goodstream.cc/"),
      );

    for (const nestedUrl of nestedUrls) {
      const { stdout } = await execFileAsync("curl", [
        "-sS",
        "--compressed",
        nestedUrl,
        "-H",
        "Accept: */*",
        "-H",
        "Origin: https://goodstream.cc",
        "-H",
        `Referer: https://goodstream.cc/embed/${embedId}`,
        "-H",
        `User-Agent: ${USER_AGENT}`,
      ]);

      if (stdout.includes("#EXTM3U")) {
        playlist = stdout;
        break;
      }
    }

    playlist = (
      await Promise.all(
        playlist.split(/\r?\n/).map(async (line) => {
          const value = line.trim();

          if (
            segmentWorkerProxy &&
            (value.includes(".goodcdn") || value.includes(".letsgocdn"))
          ) {
            const encrypted = await encryptUrl(value);

            const headers = await encryptUrl(
              JSON.stringify({
                Referer: `https://goodstream.cc/embed/${embedId}`,
                "User-Agent": USER_AGENT,
                Accept: "*/*",
              }),
            );

            return `${segmentWorkerProxy}hls?segment=${encodeURIComponent(
              encrypted,
            )}&header=${encodeURIComponent(headers)}`;
          }

          return line;
        }),
      )
    ).join("\n");

    if (playlist.includes("#EXTM3U")) {
      const cacheDir = path.dirname(cacheFile);

      await mkdir(cacheDir, { recursive: true });
      await writeFile(cacheFile, playlist);
    }

    return new Response(playlist, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response("Upstream error", { status: 502 });
  }
}
