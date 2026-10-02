import { NextRequest, NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { workerProxies, workerProxyHealth } from "@/lib/proxy-health-checker";
import { decryptUrl, encryptUrl } from "@/lib/aes-encryptor";
import { logRequest } from "@/lib/log-request";

export const runtime = "nodejs";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36";

async function fetchUpstream(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "*/*",
      Origin: "https://closeload.top",
      Referer: "https://closeload.top/",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Upstream returned ${response.status}`);
  }

  return response;
}

function getVariantScore(line: string) {
  const resolution = line.match(/RESOLUTION=(\d+)x(\d+)/);
  const bandwidth = line.match(/(?:AVERAGE-BANDWIDTH|BANDWIDTH)=(\d+)/);

  const width = resolution ? Number(resolution[1]) : 0;
  const height = resolution ? Number(resolution[2]) : 0;
  const bitrate = bandwidth ? Number(bandwidth[1]) : 0;

  return {
    resolution: width * height,
    bandwidth: bitrate,
  };
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  const tmdbId = req.nextUrl.searchParams.get("id");
  const mediaType = req.nextUrl.searchParams.get("mediaType");
  const season = req.nextUrl.searchParams.get("season") || "1";
  const episode = req.nextUrl.searchParams.get("episode") || "1";

  if (!target || !tmdbId || !mediaType) {
    return new Response("Missing parameters", { status: 400 });
  }

  let targetUrl: string;

  try {
    targetUrl = await decryptUrl(target);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  const cacheKey =
    mediaType === "movie"
      ? `movie-${tmdbId}-rido`
      : `tv-${tmdbId}-s${season}-e${episode}-rido`;

  const cacheFile = path.join("/apps/cache/rido", cacheKey, "playlist.m3u8");

  try {
    let playlist: string | null = null;
    let playlistUrl = targetUrl;

    /*
     * FINAL MEDIA PLAYLIST CACHE
     *
     * Same pattern as Holly.
     * Only the final media playlist is cached.
     * Master playlists are never cached.
     */
    try {
      const cached = await readFile(cacheFile, "utf8");

      if (cached.includes("#EXTM3U") && !cached.includes("#EXT-X-STREAM-INF")) {
        playlist = cached;
      }
    } catch {}

    /*
     * FETCH SOURCE / MASTER
     */
    if (!playlist) {
      const response = await fetchUpstream(targetUrl);
      const upstreamPlaylist = await response.text();

      if (!upstreamPlaylist.includes("#EXTM3U")) {
        throw new Error("Invalid HLS playlist");
      }

      /*
       * MASTER PLAYLIST
       *
       * Select highest available variant.
       * Master is never cached.
       */
      if (upstreamPlaylist.includes("#EXT-X-STREAM-INF")) {
        const baseUrl = new URL(targetUrl);
        const lines = upstreamPlaylist.split(/\r?\n/);

        const variants: {
          url: string;
          resolution: number;
          bandwidth: number;
        }[] = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          if (!line.startsWith("#EXT-X-STREAM-INF:")) {
            continue;
          }

          const variantLine = lines[i + 1]?.trim();

          if (!variantLine || variantLine.startsWith("#")) {
            continue;
          }

          try {
            const variantUrl = new URL(variantLine, baseUrl).toString();

            const score = getVariantScore(line);

            variants.push({
              url: variantUrl,
              resolution: score.resolution,
              bandwidth: score.bandwidth,
            });
          } catch {}
        }

        if (!variants.length) {
          throw new Error("No HLS variants found");
        }

        variants.sort((a, b) => {
          if (b.resolution !== a.resolution) {
            return b.resolution - a.resolution;
          }

          return b.bandwidth - a.bandwidth;
        });

        playlistUrl = variants[0].url;

        const variantResponse = await fetchUpstream(playlistUrl);

        playlist = await variantResponse.text();

        if (
          !playlist.includes("#EXTM3U") ||
          playlist.includes("#EXT-X-STREAM-INF")
        ) {
          throw new Error("Invalid variant playlist");
        }
      } else {
        /*
         * Already a media playlist.
         */
        playlist = upstreamPlaylist;
      }

      /*
       * Cache ONLY the final media playlist.
       */
      const cacheDir = path.dirname(cacheFile);

      await mkdir(cacheDir, { recursive: true });
      await writeFile(cacheFile, playlist);
    }

    /*
     * WORKER PROXY
     *
     * Same segment-proxy pattern as Holly.
     */
    const segmentWorkerProxy = await workerProxyHealth(workerProxies);

    if (!segmentWorkerProxy) {
      logRequest(req, "RIDO EDGE", 502, "No proxy available");

      return NextResponse.json(
        {
          success: false,
          error: "No proxy available",
          server: "rido",
        },
        { status: 502 },
      );
    }

    /*
     * REWRITE SEGMENTS TO WORKER
     */
    const baseUrl = new URL(playlistUrl);

    playlist = (
      await Promise.all(
        playlist.split(/\r?\n/).map(async (line) => {
          const value = line.trim();

          if (!value || value.startsWith("#")) {
            return line;
          }

          let segmentUrl: string;

          try {
            segmentUrl = new URL(value, baseUrl).toString();
          } catch {
            return line;
          }

          const encrypted = await encryptUrl(segmentUrl);

          const headers = await encryptUrl(
            JSON.stringify({
              Referer: "https://closeload.top/",
              "User-Agent": USER_AGENT,
              Accept: "*/*",
            }),
          );

          return `${segmentWorkerProxy}a?y=${encodeURIComponent(
            encrypted,
          )}&h=${encodeURIComponent(headers)}`;
        }),
      )
    ).join("\n");

    return new Response(playlist, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("[RIDO EDGE]", error);

    return new Response("Upstream error", { status: 502 });
  }
}
