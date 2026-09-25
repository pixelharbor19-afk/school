import { ALLOWED_ORIGINS } from "@/lib/allowed-referers";
import { FIELD_MAP } from "@/lib/field-map";
import { logRequest } from "@/lib/log-request";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { fetch, ProxyAgent } from "undici";

interface MediaOption {
  id: string;
  display: string;
  file: string;
}

const movieboxSupabase = createClient(
  process.env.SUPABASE_URL_MOVIEBOX_WEB2!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_MOVIEBOX_WEB2!,
);

const subtitleSupabase = createClient(
  process.env.SUPABASE_URL_SUBTITLE!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_SUBTITLE!,
);

const residentialProxy = new ProxyAgent(process.env.RESIDENTIAL_PROXY!);

function getCorsHeaders(origin: string | null) {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }

  return headers;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req.headers.get("origin")),
  });
}

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  const { searchParams } = req.nextUrl;

  const tmdbId = searchParams.get(FIELD_MAP.id);
  const mediaType = searchParams.get(FIELD_MAP.mediaType) || "movie";
  const season = searchParams.get(FIELD_MAP.season) || "";
  const episode = searchParams.get(FIELD_MAP.episode) || "";

  if (!tmdbId) {
    return NextResponse.json(
      {
        success: false,
        error: "id is required",
      },
      {
        status: 400,
        headers: corsHeaders,
      },
    );
  }

  try {
    let cacheQuery = subtitleSupabase
      .from("moviebox_subtitle_cache")
      .select("captions")
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType);

    if (season && episode) {
      cacheQuery = cacheQuery
        .eq("season", Number(season))
        .eq("episode", Number(episode));
    } else {
      cacheQuery = cacheQuery.is("season", null).is("episode", null);
    }

    const { data: cached } = await cacheQuery
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return NextResponse.json(
        {
          captions: cached.captions as MediaOption[],
        },
        {
          headers: corsHeaders,
        },
      );
    }

    const { data: moviebox, error } = await movieboxSupabase
      .from("moviebox_cache")
      .select("dubs")
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const dubs = moviebox?.dubs ?? [];
    const selectedDub = dubs.find((dub: any) => dub.original) ?? dubs[0];

    if (!selectedDub?.subjectId || !selectedDub?.detailPath) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid dub found",
        },
        {
          status: 404,
          headers: corsHeaders,
        },
      );
    }

    const url = new URL(
      "https://h5-api.aoneroom.com/wefeed-h5api-bff/subject/download",
    );

    url.searchParams.set("subjectId", selectedDub.subjectId);

    if (season) url.searchParams.set("se", season);
    if (episode) url.searchParams.set("ep", episode);

    url.searchParams.set("detailPath", selectedDub.detailPath);
    url.searchParams.set("supportCodecs[h264]", "1");
    url.searchParams.set("supportCodecs[hevc]", "1");

    const response = await fetch(url.toString(), {
      dispatcher: residentialProxy,
      signal: AbortSignal.timeout(15_000),
      headers: {
        Accept: "application/json",
        Origin: "https://videodownloader.site",
        Referer: "https://videodownloader.site/",
        "X-Client-Info": JSON.stringify({
          timezone: "Asia/Manila",
        }),
        "X-Request-Lang": "en",
      },
      cache: "no-store",
    });

    const data: any = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          status: response.status,
          data,
        },
        {
          status: response.status,
          headers: corsHeaders,
        },
      );
    }

    const captions: MediaOption[] = (data.data?.captions ?? []).map(
      (caption: any) => ({
        id: caption.id,
        display: caption.lanName,
        file: caption.url,
      }),
    );

    await subtitleSupabase.from("moviebox_subtitle_cache").upsert(
      {
        tmdb_id: tmdbId,
        media_type: mediaType,
        season: season ? Number(season) : null,
        episode: episode ? Number(episode) : null,
        captions,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        onConflict: "tmdb_id,media_type,season,episode",
      },
    );

    return NextResponse.json(
      {
        captions,
      },
      {
        headers: corsHeaders,
      },
    );
  } catch (err) {
    logRequest(
      req,
      "SUBTITLE",
      500,
      err instanceof Error ? err.message : "Request failed",
    );

    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Request failed",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}
