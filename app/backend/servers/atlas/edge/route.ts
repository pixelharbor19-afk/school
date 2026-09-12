// /backend/atlas/edge/route.ts
import { NextRequest } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  const tmdbId = req.nextUrl.searchParams.get("id");
  const mediaType = req.nextUrl.searchParams.get("mediaType");
  const season = req.nextUrl.searchParams.get("season");
  const episode = req.nextUrl.searchParams.get("episode");

  const cacheKey =
    mediaType === "movie"
      ? `movie-${tmdbId}`
      : `tv-${tmdbId}-s${season}-e${episode}`;

  const cacheFile = path.join("/apps/cache", cacheKey, "playlist.m3u8");

  const domain = "https://vidstuck.xyz";

  try {
    try {
      const cached = await readFile(cacheFile, "utf8");

      if (cached.includes("#EXTINF:")) {
        return new Response(cached, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
          },
        });
      }
    } catch {}

    if (!target) {
      return new Response("Missing url", { status: 400 });
    }

    const url = new URL(target);
    const embedId = url.pathname.split("/")[2];

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

    const playlist = stdout
      .split(/\r?\n/)
      .map((line) => {
        const value = line.trim();

        if (
          value.startsWith("https://goodstream.cc/pl/") ||
          value.startsWith("https://www.goodstream.cc/pl/")
        ) {
          return `${domain}/backend/servers/atlas/edge?url=${encodeURIComponent(
            value,
          )}&id=${tmdbId}&mediaType=${mediaType}&season=${season}&episode=${episode}`;
        }

        return line;
      })
      .join("\n");

    if (playlist.includes("#EXTINF:")) {
      const cacheDir = path.dirname(cacheFile);

      await mkdir(cacheDir, { recursive: true });
      await writeFile(cacheFile, playlist);
    }

    return new Response(playlist, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
      },
    });
  } catch {
    return new Response("Upstream error", { status: 502 });
  }
}
