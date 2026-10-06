import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logRequest } from "@/lib/log-request";
import { encryptUrl } from "@/lib/aes-encryptor";
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { encryptLink } from "@/lib/source-link-enc-dec";

const supabase = createClient(
  process.env.SUPABASE_URL_MOVIEBOX_WEB2!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_MOVIEBOX_WEB2!,
);

export async function GET(req: NextRequest) {
  const { searchParams, pathname } = req.nextUrl;
  const path = pathname.split("/").pop()!;

  try {
    const tmdbId = searchParams.get("id");
    const mediaType = searchParams.get("mediaType");
    const season = searchParams.get("season") ?? "";
    const episode = searchParams.get("episode") ?? "";
    const dubCode = searchParams.get("dubCode");
    const dubType = searchParams.get("dubType");

    if (!tmdbId || !mediaType) {
      logRequest(req, "GAIAFLIX", 400, "missing params");

      return NextResponse.json(
        {
          success: false,
          error: "missing params",
          server: path,
        },
        { status: 400 },
      );
    }

    const { data: cached } = await supabase
      .from("moviebox_cache")
      .select("dubs")
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType)
      .maybeSingle();

    const dubs = cached?.dubs ?? [];

    if (!dubs.length) {
      logRequest(req, "GAIAFLIX", 404, "Unavailable");

      return NextResponse.json(
        {
          success: false,
          error: "Unavailable",
          server: path,
        },
        { status: 404 },
      );
    }

    const selectedDub =
      dubs.find(
        (dub: any) =>
          dub.lanCode === dubCode && String(dub.type) === String(dubType),
      ) ??
      dubs.find((dub: any) => dub.original === true) ??
      dubs[0];

    const publicDubs = dubs.map(
      ({ subjectId, detailPath, ...dub }: any) => dub,
    );

    if (!selectedDub?.subjectId) {
      logRequest(req, "GAIAFLIX", 404, "Dub source not found");

      return NextResponse.json(
        {
          success: false,
          error: "Dub source not found",
          server: path,
        },
        { status: 404 },
      );
    }

    const dub = selectedDub.lanCode;
    const type = Number(selectedDub.type) || 0;
    const original = selectedDub.original === true;

    const { data: cachedSource } = await supabase
      .from("moviebox_tv_sources_cache")
      .select("playlist, cookie")
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType)
      .eq("season", season)
      .eq("episode", episode)
      .eq("dub", dub)
      .eq("type", type)
      .eq("original", original)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cachedSource?.playlist && cachedSource?.cookie) {
      const url = await encryptUrl(cachedSource.playlist);

      const header = await encryptUrl(
        JSON.stringify({
          Cookie: cachedSource.cookie,
        }),
      );

      const links = [
        {
          type: "dash",
          link: encryptLink(
            `/backend/database/andromeda?url=${url}&header=${header}`,
          ),
          resolution: 0,
        },
      ];

      logRequest(req, "GAIAFLIX", 200, "Cache hit");

      return NextResponse.json({
        success: true,
        links,
        dubs: publicDubs,
        cached: true,
        server: path,
      });
    }

    const params = new URLSearchParams({
      subjectId: selectedDub.subjectId,
    });

    if (mediaType === "tv") {
      params.set("season", season);
      params.set("episode", episode);
    }

    const res = await fetchWithTimeout(
      `https://vidstuck.xyz/backend/database/mboxtv?${params.toString()}`,
      {
        cache: "no-store",
      },
    );

    if (!res.ok) {
      logRequest(req, "GAIAFLIX", res.status, "Main request failed");

      return NextResponse.json(
        {
          success: false,
          error: "Main request failed",
          server: path,
        },
        { status: res.status },
      );
    }

    const scraped = await res.json();
    const source = scraped?.streams?.[0];

    if (!source?.url || !source?.signCookie) {
      logRequest(req, "GAIAFLIX", 404, "No sources found");

      return NextResponse.json(
        {
          success: false,
          error: "No sources found",
          server: path,
        },
        { status: 404 },
      );
    }

    const resolution =
      Number(String(source.quality ?? "").match(/\d+/)?.[0]) || 0;

    const url = await encryptUrl(source.url);

    const header = await encryptUrl(
      JSON.stringify({
        Cookie: source.signCookie,
      }),
    );

    const links = [
      {
        type: source.format ?? "dash",
        link: `https://vidstuck.xyz/backend/database/andromeda?url=${url}&header=${header}`,
        resolution,
      },
    ];

    logRequest(req, "GAIAFLIX", 200, "OK");

    return NextResponse.json({
      success: true,
      links,
      dubs: publicDubs,
      cached: false,
      server: path,
    });
  } catch (error) {
    console.error("[GAIAFLIX]", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        server: path,
      },
      { status: 500 },
    );
  }
}
