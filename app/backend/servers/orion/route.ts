import { NextRequest, NextResponse } from "next/server";
import { validateBackendToken } from "@/lib/validate-token";
import { createClient } from "@supabase/supabase-js";
import { FIELD_MAP } from "@/lib/field-map";
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
    const tmdbId = searchParams.get(FIELD_MAP.id);
    const mediaType = searchParams.get(FIELD_MAP.mediaType);
    const season = searchParams.get(FIELD_MAP.season) ?? "";
    const episode = searchParams.get(FIELD_MAP.episode) ?? "";
    const title = searchParams.get(FIELD_MAP.title);
    const ts = Number(searchParams.get(FIELD_MAP.ts));
    const token = searchParams.get(FIELD_MAP.token);
    const date = searchParams.get(FIELD_MAP.date);
    const latestDate = searchParams.get(FIELD_MAP.latestDate);
    const dubCode = searchParams.get("dubCode");
    const dubType = searchParams.get("dubType");

    if (
      !tmdbId ||
      !mediaType ||
      !title ||
      !date ||
      !Number.isFinite(ts) ||
      !token
    ) {
      logRequest(req, "ORION", 400, "missing params");

      return NextResponse.json(
        {
          success: false,
          error: "missing params",
          server: path,
        },
        { status: 400 },
      );
    }

    if (
      !validateBackendToken(tmdbId, mediaType, season, episode, path, ts, token)
    ) {
      logRequest(req, "ORION", 401, "Invalid token");

      return NextResponse.json(
        {
          success: false,
          error: "Invalid token",
          server: path,
        },
        { status: 401 },
      );
    }

    const { data: cached } = await supabase
      .from("moviebox_cache")
      .select("dubs")
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType)
      .maybeSingle();

    let dubs = cached?.dubs ?? [];

    if (!dubs.length) {
      const searchParams = new URLSearchParams({
        id: tmdbId,
        b: mediaType,
        title,
        date,
      });

      if (latestDate && mediaType === "tv") {
        searchParams.set("latestDate", latestDate);
      }

      const searchRes = await fetchWithTimeout(
        `https://vidstuck.xyz/backend/database/search-moviebox?${searchParams.toString()}`,
        {
          cache: "no-store",
        },
      );

      if (!searchRes.ok) {
        logRequest(req, "ORION", 502, "ICARUS search failed");

        return NextResponse.json(
          {
            success: false,
            error: "ICARUS search failed",
            server: path,
          },
          { status: searchRes.status },
        );
      }

      const searchData = await searchRes.json();

      if (!searchData?.success || !searchData?.dubs?.length) {
        logRequest(req, "ORION", 404, "Unavailable");

        return NextResponse.json(
          {
            success: false,
            error: "Unavailable",
            server: path,
          },
          { status: 404 },
        );
      }

      dubs = searchData.dubs;

      await supabase.from("moviebox_cache").upsert(
        {
          tmdb_id: tmdbId,
          media_type: mediaType,
          dubs,
          release_date: date,
          title,
        },
        {
          onConflict: "tmdb_id,media_type",
          ignoreDuplicates: true,
        },
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
      logRequest(req, "ORION", 404, "Dub source not found");

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

      logRequest(req, "ORION", 200, "Cache hit");

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
      `http://localhost:3000/backend/database/mboxtv?${params.toString()}`,
      {
        cache: "no-store",
      },
    );

    if (!res.ok) {
      logRequest(req, "ORION", res.status, "Main request failed");

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
      logRequest(req, "ORION", 404, "No sources found");

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

    await supabase.from("moviebox_tv_sources_cache").upsert(
      {
        tmdb_id: tmdbId,
        media_type: mediaType,
        season,
        episode,
        dub,
        type,
        original,
        playlist: source.url,
        cookie: source.signCookie,
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      },
      {
        onConflict: "tmdb_id,media_type,season,episode,dub,type,original",
      },
    );

    const url = await encryptUrl(source.url);

    const header = await encryptUrl(
      JSON.stringify({
        Cookie: source.signCookie,
      }),
    );

    const links = [
      {
        type: source.format ?? "dash",
        link: encryptLink(
          `/backend/database/andromeda?url=${url}&header=${header}`,
        ),
        resolution,
      },
    ];

    logRequest(req, "ORION", 200, "OK");

    return NextResponse.json({
      success: true,
      links,
      dubs: publicDubs,
      cached: false,
      server: path,
    });
  } catch (error) {
    console.error("[SOMBRERO]", error);

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
