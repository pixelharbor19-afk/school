import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FIELD_MAP } from "@/lib/field-map";
import { logRequest } from "@/lib/log-request";
import { validateBackendToken } from "@/lib/validate-token";
import { isValidReferer } from "@/lib/allowed-referers";
import { encryptLink } from "@/lib/source-link-enc-dec";

const supabase = createClient(
  process.env.NEXT_PUBLIC_HOLLY_SUPABASE_URL_HOLLY!,
  process.env.HOLLY_SUPABASE_SERVICE_ROLE_KEY_HOLLY!,
);

export async function GET(req: NextRequest) {
  const domain = "https://vidstuck.xyz";
  const path = req.nextUrl.pathname.split("/").pop()!;
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
    logRequest(req, "MILKY WAY", 400, "missing params");
    return NextResponse.json(
      { success: false, error: "missing params", server: path },
      { status: 400 },
    );
  }
  if (
    !validateBackendToken(tmdbId, mediaType, season, episode, path, ts, token)
  ) {
    logRequest(req, "MILKY WAY", 401, "invalid token");
    return NextResponse.json(
      { success: false, error: "Invalid token", server: path },
      { status: 401 },
    );
  }
  const referer = req.headers.get("referer") || "";
  if (!isValidReferer(referer)) {
    logRequest(req, "MILKY WAY", 401, "invalid referrer");
    return NextResponse.json(
      { success: false, error: "Forbidden", server: path },
      { status: 403 },
    );
  }

  try {
    const { data: cached } = await supabase
      .from("holly_movie_cache")
      .select("sources")
      .eq("tmdb_id", Number(tmdbId))
      .eq("media_type", mediaType)
      .eq("season", season)
      .eq("episode", episode)
      .single();

    if (!cached?.sources?.length) {
      return NextResponse.json(
        { success: false, error: "No cached sources", server: path },
        { status: 404 },
      );
    }

    const links = cached.sources
      .filter((s: any) => s.type !== "mp4")
      .map((source: any) => ({
        type: source.type,
        resolution: null,
        link: encryptLink(
          `${domain}/backend/servers/atlas/edge?url=${encodeURIComponent(
            source.file,
          )}&id=${tmdbId}&mediaType=${mediaType}&season=${encodeURIComponent(
            season,
          )}&episode=${encodeURIComponent(episode)}`,
        ),
      }));

    if (!links.length) {
      return NextResponse.json(
        { success: false, error: "No /pl/ sources found", server: path },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      links,
      server: path,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error", server: path },
      { status: 500 },
    );
  }
}
