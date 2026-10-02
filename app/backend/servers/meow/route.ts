import { NextRequest, NextResponse } from "next/server";
import { validateBackendToken } from "@/lib/validate-token";
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { FIELD_MAP } from "@/lib/field-map";
import { createClient } from "@supabase/supabase-js";
import { encryptUrl } from "@/lib/aes-encryptor";
import { encryptLink } from "@/lib/source-link-enc-dec";
import { logRequest } from "@/lib/log-request";

const supabase = createClient(
  process.env.SUPABASE_URL_RIDO!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_RIDO!,
);

const RIDO_URL = "https://overcrowd-justice-unmindful.ngrok-free.dev";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.pathname.split("/").pop()!;

  try {
    const tmdbId = req.nextUrl.searchParams.get(FIELD_MAP.id);
    const mediaType = req.nextUrl.searchParams.get(FIELD_MAP.mediaType);
    const season = req.nextUrl.searchParams.get(FIELD_MAP.season) ?? "";
    const episode = req.nextUrl.searchParams.get(FIELD_MAP.episode) ?? "";
    const title = req.nextUrl.searchParams.get(FIELD_MAP.title);
    const year = req.nextUrl.searchParams.get(FIELD_MAP.year);
    const ts = Number(req.nextUrl.searchParams.get(FIELD_MAP.ts));
    const token = req.nextUrl.searchParams.get(FIELD_MAP.token);
    const date = req.nextUrl.searchParams.get(FIELD_MAP.date);

    if (!tmdbId || !mediaType || !title || !year || !ts || !token || !date) {
      logRequest(req, "TEST", 400, "missing params");

      return NextResponse.json(
        { success: false, error: "missing params", server: path },
        { status: 400 },
      );
    }

    if (
      !validateBackendToken(tmdbId, mediaType, season, episode, path, ts, token)
    ) {
      logRequest(req, "TEST", 401, "invalid token");

      return NextResponse.json(
        { success: false, error: "Invalid token", server: path },
        { status: 401 },
      );
    }

    let source: string;

    const { data: cached } = await supabase
      .from("rido_movie_cache")
      .select("embeds, sources")
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType)
      .eq("season", season)
      .eq("episode", episode)
      .maybeSingle();

    if (cached?.sources?.length) {
      source = cached.sources[0];
    } else {
      const ridoUrl = new URL(RIDO_URL);

      ridoUrl.searchParams.set("tmdb_id", tmdbId);
      ridoUrl.searchParams.set("title", title);
      ridoUrl.searchParams.set("media_type", mediaType);

      if (mediaType === "tv") {
        ridoUrl.searchParams.set("season", season);
        ridoUrl.searchParams.set("episode", episode);
      }

      const ridoRes = await fetchWithTimeout(
        ridoUrl.toString(),
        { headers: { Accept: "application/json" } },
        30000,
      );

      const ridoData = await ridoRes.json();

      const embed = ridoData?.iframes?.find((url: string) =>
        url.includes("closeload.top"),
      );

      if (!embed) {
        logRequest(req, "TEST", 404, "no closeload embed");

        return NextResponse.json(
          {
            success: false,
            error: "No closeload embed found",
            server: path,
          },
          { status: 404 },
        );
      }

      const sourceUrl = new URL("/backend/database/rido", req.nextUrl.origin);

      sourceUrl.searchParams.set("url", embed);

      const sourceRes = await fetchWithTimeout(
        sourceUrl.toString(),
        { headers: { Accept: "application/json" } },
        30000,
      );

      const sourceData = await sourceRes.json();

      source = sourceData?.source;

      if (!source) {
        logRequest(req, "TEST", 404, "no source found");

        return NextResponse.json(
          {
            success: false,
            error: "No source found",
            server: path,
          },
          { status: 404 },
        );
      }

      await supabase.from("rido_movie_cache").upsert(
        {
          tmdb_id: tmdbId,
          media_type: mediaType,
          season,
          episode,
          embeds: ridoData.iframes ?? [],
          sources: [source],
        },
        {
          onConflict: "tmdb_id,media_type,season,episode",
        },
      );
    }

    const encrypted = await encryptUrl(source);

    const links = [
      {
        type: "hls" as const,
        link: encryptLink(
          `/backend/servers/meow/edge?url=${encodeURIComponent(
            encrypted,
          )}&id=${encodeURIComponent(tmdbId)}&mediaType=${encodeURIComponent(
            mediaType,
          )}&season=${encodeURIComponent(season)}&episode=${encodeURIComponent(
            episode,
          )}`,
        ),
        resolution: null,
      },
    ];

    logRequest(req, "TEST", 200, "OK");

    return NextResponse.json({
      success: true,
      links,
      subtitles: [],
      meow: !!cached,
      server: path,
    });
  } catch (err) {
    console.error("[MEOW]", err);

    logRequest(
      req,
      "TEST",
      500,
      err instanceof Error ? err.message : String(err),
    );

    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        server: path,
      },
      { status: 500 },
    );
  }
}
