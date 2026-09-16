import { FIELD_MAP } from "@/lib/field-map";
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
export async function GET(req: NextRequest) {
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
      { status: 400 },
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
      return NextResponse.json({
        captions: cached.captions as MediaOption[],
      });
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
        { status: 404 },
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
        { status: response.status },
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

    return NextResponse.json({
      captions,
    });
  } catch (error) {
    console.error("API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Request failed",
      },
      { status: 500 },
    );
  }
}
