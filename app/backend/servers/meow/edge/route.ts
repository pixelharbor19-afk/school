import { NextRequest, NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { workerProxies, workerProxyHealth } from "@/lib/proxy-health-checker";
import { decryptUrl, encryptUrl } from "@/lib/aes-encryptor";
import { logRequest } from "@/lib/log-request";
import { fetchWithTimeout } from "@/lib/fetch-timeout";

export const runtime = "nodejs";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36";

async function fetchUpstream(url: string) {
  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        Accept: "*/*",
        Origin: "https://closeload.top",
        Referer: "https://closeload.top/",
        "User-Agent": USER_AGENT,
      },
    },
    30000,
  );

  if (!response.ok) {
    throw new Error(`Upstream returned ${response.status}`);
  }

  return response;
}

function getVariantInfo(line: string) {
  const resolution = line.match(/RESOLUTION=(\d+)x(\d+)/);

  return {
    width: resolution ? Number(resolution[1]) : 0,
    height: resolution ? Number(resolution[2]) : 0,
  };
}

async function rewritePlaylist(
  playlist: string,
  playlistUrl: string,
  segmentWorkerProxy: string,
) {
  const baseUrl = new URL(playlistUrl);

  return (
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
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  const tmdbId = req.nextUrl.searchParams.get("id");
  const mediaType = req.nextUrl.searchParams.get("mediaType");
  const season = req.nextUrl.searchParams.get("season") || "1";
  const episode = req.nextUrl.searchParams.get("episode") || "1";
  const playlist = req.nextUrl.searchParams.get("playlist");

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

  const cacheDir = path.join("/apps/rido-cache", cacheKey);
  const masterCacheFile = path.join(cacheDir, "master.m3u8");
  const audioCacheFile = path.join(cacheDir, "audio.m3u8");

  try {
    /*
     * SERVE CACHED VIDEO PLAYLIST
     *
     * targetUrl is the ORIGINAL URL of this specific playlist.
     * This is required for relative segment URLs.
     */
    if (playlist && playlist !== "audio") {
      const cacheFile = path.join(cacheDir, `${playlist}.m3u8`);

      const cachedPlaylist = await readFile(cacheFile, "utf8");

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

      const rewritten = await rewritePlaylist(
        cachedPlaylist,
        targetUrl,
        segmentWorkerProxy,
      );

      return new Response(rewritten, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    /*
     * SERVE CACHED AUDIO
     *
     * targetUrl is the ORIGINAL audio playlist URL.
     */
    if (playlist === "audio") {
      const cachedAudio = await readFile(audioCacheFile, "utf8");

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

      const rewritten = await rewritePlaylist(
        cachedAudio,
        targetUrl,
        segmentWorkerProxy,
      );

      return new Response(rewritten, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    /*
     * RETURN CACHED MASTER
     */
    try {
      const cachedMaster = await readFile(masterCacheFile, "utf8");

      if (
        cachedMaster.includes("#EXTM3U") &&
        cachedMaster.includes("#EXT-X-STREAM-INF")
      ) {
        return new Response(cachedMaster, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } catch {}

    /*
     * FETCH SOURCE
     */
    const response = await fetchUpstream(targetUrl);
    const upstreamPlaylist = await response.text();

    if (!upstreamPlaylist.includes("#EXTM3U")) {
      throw new Error("Invalid HLS playlist");
    }

    /*
     * DIRECT MEDIA PLAYLIST
     */
    if (!upstreamPlaylist.includes("#EXT-X-STREAM-INF")) {
      await mkdir(cacheDir, { recursive: true });

      const cacheFile = path.join(cacheDir, "source.m3u8");

      await writeFile(cacheFile, upstreamPlaylist);

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

      const rewritten = await rewritePlaylist(
        upstreamPlaylist,
        targetUrl,
        segmentWorkerProxy,
      );

      return new Response(rewritten, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    /*
     * MASTER PLAYLIST
     */
    const baseUrl = new URL(targetUrl);
    const lines = upstreamPlaylist.split(/\r?\n/);

    const audioGroups = new Map<
      string,
      {
        line: string;
        url: string;
      }
    >();

    /*
     * FIND AUDIO GROUPS
     */
    for (const line of lines) {
      const value = line.trim();

      if (!value.startsWith("#EXT-X-MEDIA:") || !value.includes("TYPE=AUDIO")) {
        continue;
      }

      const group = value.match(/GROUP-ID="([^"]+)"/);
      const uri = value.match(/URI="([^"]+)"/);

      if (!group || !uri) {
        continue;
      }

      try {
        audioGroups.set(group[1], {
          line: value,
          url: new URL(uri[1], baseUrl).toString(),
        });
      } catch {}
    }

    /*
     * FIND EVERY VIDEO VARIANT
     *
     * Nothing is filtered.
     * Duplicate resolutions are preserved as:
     * 1080.m3u8
     * 1080-2.m3u8
     * 1080-3.m3u8
     */
    const variants: {
      url: string;
      height: number;
      line: string;
      audioGroup: string | null;
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
        const info = getVariantInfo(line);

        variants.push({
          url: new URL(variantLine, baseUrl).toString(),
          height: info.height,
          line,
          audioGroup: line.match(/AUDIO="([^"]+)"/)?.[1] ?? null,
        });
      } catch {}
    }

    if (!variants.length) {
      throw new Error("No HLS variants found");
    }

    await mkdir(cacheDir, { recursive: true });

    /*
     * CACHE EVERY VIDEO VARIANT
     */
    const qualityCounts = new Map<string, number>();

    const cachedVariants: {
      variant: (typeof variants)[number];
      playlistName: string;
    }[] = [];

    for (const variant of variants) {
      const baseName = variant.height > 0 ? String(variant.height) : "source";

      const count = (qualityCounts.get(baseName) || 0) + 1;

      qualityCounts.set(baseName, count);

      const playlistName = count === 1 ? baseName : `${baseName}-${count}`;

      const cacheFile = path.join(cacheDir, `${playlistName}.m3u8`);

      const variantResponse = await fetchUpstream(variant.url);
      const videoPlaylist = await variantResponse.text();

      if (
        !videoPlaylist.includes("#EXTM3U") ||
        videoPlaylist.includes("#EXT-X-STREAM-INF")
      ) {
        throw new Error(`Invalid ${playlistName} playlist`);
      }

      await writeFile(cacheFile, videoPlaylist);

      cachedVariants.push({
        variant,
        playlistName,
      });
    }

    /*
     * FIND AUDIO
     */
    let selectedAudio: {
      line: string;
      url: string;
    } | null = null;

    for (const variant of variants) {
      if (!variant.audioGroup) {
        continue;
      }

      const audio = audioGroups.get(variant.audioGroup);

      if (audio) {
        selectedAudio = audio;
        break;
      }
    }

    /*
     * CACHE AUDIO
     */
    let audioPlaylist: string | null = null;

    if (selectedAudio) {
      const audioResponse = await fetchUpstream(selectedAudio.url);

      audioPlaylist = await audioResponse.text();

      if (
        !audioPlaylist.includes("#EXTM3U") ||
        audioPlaylist.includes("#EXT-X-STREAM-INF")
      ) {
        throw new Error("Invalid audio playlist");
      }

      await writeFile(audioCacheFile, audioPlaylist);
    }

    /*
     * CREATE LOCAL EDGE URL
     *
     * IMPORTANT:
     *
     * The encrypted URL is the ORIGINAL URL of the
     * specific playlist being requested.
     *
     * This makes relative segment URLs work correctly.
     */
    const createEdgeUrl = async (playlistType: string, playlistUrl: string) => {
      const encryptedPlaylistUrl = await encryptUrl(playlistUrl);

      const edgeUrl = new URL(req.nextUrl.pathname, "https://vidstuck.xyz");

      edgeUrl.searchParams.set("url", encryptedPlaylistUrl);

      edgeUrl.searchParams.set("id", tmdbId);

      edgeUrl.searchParams.set("mediaType", mediaType);

      edgeUrl.searchParams.set("season", season);

      edgeUrl.searchParams.set("episode", episode);

      edgeUrl.searchParams.set("playlist", playlistType);

      return edgeUrl.toString();
    };

    /*
     * BUILD MASTER
     */
    let master = "#EXTM3U\n";

    /*
     * AUDIO → LOCAL CACHE
     */
    if (selectedAudio && audioPlaylist) {
      const audioEdgeUrl = await createEdgeUrl("audio", selectedAudio.url);

      const rewrittenAudioLine = selectedAudio.line.replace(
        /URI="[^"]+"/,
        `URI="${audioEdgeUrl}"`,
      );

      master += `${rewrittenAudioLine}\n`;
    }

    /*
     * EVERY VIDEO VARIANT → LOCAL CACHE
     */
    for (const { variant, playlistName } of cachedVariants) {
      const videoEdgeUrl = await createEdgeUrl(playlistName, variant.url);

      master += `${variant.line}\n`;
      master += `${videoEdgeUrl}\n`;
    }

    /*
     * CACHE MASTER
     */
    await writeFile(masterCacheFile, master);

    return new Response(master, {
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
