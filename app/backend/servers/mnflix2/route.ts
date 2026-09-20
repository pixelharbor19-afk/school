import { NextRequest, NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { createClient } from "@supabase/supabase-js";
import { encryptUrl } from "@/lib/aes-encryptor";
import { encryptLink } from "@/lib/source-link-enc-dec";
import { workerProxies, workerProxyHealth } from "@/lib/proxy-health-checker";
import { logRequest } from "@/lib/log-request";

const supabase = createClient(
  process.env.SUPABASE_URL_BERKAS!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_BERKAS!,
);

const STREAMDATA_URL = "https://streamdata.vaplayer.ru/api.php";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.pathname.split("/").pop()!;

  try {
    const { searchParams, pathname } = req.nextUrl;
    const tmdbId = searchParams.get("tmdbId");
    const mediaType = searchParams.get("mediaType");
    const season = searchParams.get("season") ?? "";
    const episode = searchParams.get("episode") ?? "";
    const path = pathname.split("/").pop()!;

    if (!tmdbId || !mediaType) {
      logRequest(req, "MILKY WAY", 400, "missing params");
      return NextResponse.json(
        { success: false, error: "missing params", server: path },
        { status: 400 },
      );
    }

    // -------- Cache Lookup --------
    let streamUrls: string[];
    let subtitles: any[];

    const cacheQuery = supabase
      .from("berkas_cache")
      .select("stream_urls, subtitles")
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType)
      .eq("season", season ?? "")
      .eq("episode", episode ?? "")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    const { data: cached } = await cacheQuery;

    if (cached) {
      streamUrls = cached.stream_urls ?? [];
      subtitles = cached.subtitles ?? [];
    } else {
      const qs = new URLSearchParams({
        tmdb: tmdbId,
        type: mediaType,
      });

      if (mediaType === "tv") {
        qs.set("season", season!);
        qs.set("episode", episode!);
      }

      const res = await fetchWithTimeout(
        `${STREAMDATA_URL}?${qs.toString()}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
            Origin: "https://nextgencloudfabric.com",
            Referer: "https://nextgencloudfabric.com/",
            Accept: "*/*",
            "Accept-Language": "en-US,en;q=0.7",
          },
        },
        8000,
      );
      const data = await res.json();

      streamUrls = data?.data?.stream_urls ?? [];

      if (data?.status_code !== "200" || !streamUrls.length) {
        logRequest(req, "MILKY WAY", 404, "no streams found");
        return NextResponse.json(
          { success: false, error: "No streams found", server: path },
          { status: 404 },
        );
      }

      subtitles = (data?.default_subs ?? []).map((sub: any, index: number) => ({
        id: sub.sid ?? sub.id ?? index,
        display:
          sub.lang ?? sub.language ?? sub.display ?? sub.code ?? "Unknown",
        language: sub.code ?? "",
        file: sub.url ?? sub.file,
      }));

      await supabase.from("berkas_cache").upsert(
        {
          tmdb_id: tmdbId,
          media_type: mediaType,
          season: season ?? "",
          episode: episode ?? "",
          stream_urls: streamUrls,
          subtitles,
          refreshed_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
        },
        { onConflict: "tmdb_id,media_type,season,episode" },
      );
    }

    const shuffledProxy = await workerProxyHealth(workerProxies);

    if (!shuffledProxy) {
      logRequest(req, "MILKY WAY", 502, "No proxy available");

      return NextResponse.json(
        {
          success: false,
          error: "No proxy available",
          server: path,
        },
        { status: 502 },
      );
    }

    const links = await Promise.all(
      streamUrls.map(async (url) => {
        const encrypted = await encryptUrl(url);

        const headers = await encryptUrl(
          JSON.stringify({
            Origin: "https://nextgencloudfabric.com",
            Referer: "https://nextgencloudfabric.com/",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
            Accept: "*/*",
          }),
        );

        return {
          type: "hls" as const,
          link: `${shuffledProxy}a?u=${encodeURIComponent(
            encrypted,
          )}&h=${encodeURIComponent(headers)}`,
          resolution: null,
        };
      }),
    );

    logRequest(req, "MILKY WAY", 200, "OK");
    return NextResponse.json({
      success: true,
      links,
      subtitles,
      meow: !!cached,
      server: path,
    });
  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error", server: path },
      { status: 500 },
    );
  }
}
