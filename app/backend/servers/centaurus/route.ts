import { NextRequest, NextResponse } from "next/server";
import { validateBackendToken } from "@/lib/validate-token";
import { isValidReferer } from "@/lib/allowed-referers";
import { createClient } from "@supabase/supabase-js";
import { encryptLink } from "@/lib/source-link-enc-dec";
import { FIELD_MAP } from "@/lib/field-map";
import { logRequest } from "@/lib/log-request";
import { encryptUrl } from "@/lib/aes-encryptor";

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
    //
    const dubCode = searchParams.get("dubCode");
    const dubType = searchParams.get("dubType");

    // -----------------------------
    // Validate params
    // -----------------------------

    if (
      !tmdbId ||
      !mediaType ||
      !title ||
      !date ||
      !Number.isFinite(ts) ||
      !token
    ) {
      logRequest(req, "MILKY WAY", 400, "missing params");

      return NextResponse.json(
        {
          success: false,
          error: "missing params",
          server: path,
        },
        { status: 400 },
      );
    }

    // -----------------------------
    // Validate token
    // -----------------------------

    if (
      !validateBackendToken(tmdbId, mediaType, season, episode, path, ts, token)
    ) {
      logRequest(req, "MILKY WAY", 401, "Invalid token");

      return NextResponse.json(
        {
          success: false,
          error: "Invalid token",
          server: path,
        },
        { status: 401 },
      );
    }

    // -----------------------------
    // Validate referer
    // -----------------------------

    if (!isValidReferer(req.headers.get("referer") || "")) {
      logRequest(req, "MILKY WAY", 403, "Forbidden");

      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          server: path,
        },
        { status: 403 },
      );
    }

    // -----------------------------
    // Cache lookup
    // -----------------------------

    const { data: cached } = await supabase
      .from("moviebox_cache")
      .select("dubs")
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType)
      .maybeSingle();

    let dubs = cached?.dubs ?? [];
    let fromCache = dubs.length > 0;
    // -----------------------------
    // Cache missing → ICARUS search
    // -----------------------------

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

      const searchRes = await fetch(
        `https://api1.zxcstream.xyz/search-moviebox?${searchParams.toString()}`,
        {
          cache: "no-store",
        },
      );

      if (!searchRes.ok) {
        logRequest(req, "MILKY WAY", 502, "ICARUS search failed");

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
        logRequest(req, "MILKY WAY", 404, "Unavailable");

        return NextResponse.json(
          {
            success: false,
            error: "Unavailable",
            server: path,
          },
          { status: 404 },
        );
      }

      // ICARUS found the dubs.
      dubs = searchData.dubs;
      fromCache = false;

      // -----------------------------
      // Save cache
      // -----------------------------

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

    // -----------------------------
    // Get dub
    // -----------------------------

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

    if (!selectedDub?.subjectId || !selectedDub?.detailPath) {
      logRequest(req, "MILKY WAY", 404, "Dub source not found");

      return NextResponse.json(
        {
          success: false,
          error: "Dub source not found",
          server: path,
        },
        { status: 404 },
      );
    }

    // -----------------------------
    // Scraper
    // -----------------------------

    const params = new URLSearchParams({
      type: "dash",
      subjectId: selectedDub.subjectId,
      detailPath: selectedDub.detailPath,
    });

    if (mediaType === "tv") {
      params.set("se", season || "0");
      params.set("ep", episode || "0");
    }
    params.set("streamSignType", "1");
    const res = await fetch(
      `https://api1.zxcstream.xyz/moviebox?${params.toString()}`,
      {
        cache: "no-store",
      },
    );

    if (!res.ok) {
      logRequest(req, "MILKY WAY", res.status, "Main request failed");

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

    if (!scraped?.data?.length) {
      logRequest(req, "MILKY WAY", 404, "No sources found");

      return NextResponse.json(
        {
          success: false,
          error: "No sources found",
          server: path,
        },
        { status: 404 },
      );
    }

    // -----------------------------
    // Encrypt links
    // -----------------------------

    const links = await Promise.all(
      scraped.data.map(async (source: any) => {
        const url = await encryptUrl(source.url);

        const header = await encryptUrl(
          JSON.stringify({
            Referer:
              "https://movibox.net/movies/the-runner-McIeQZEGPQ?id=715214082269397240&type=/movie/detail&detailSe=&detailEp=&lang=en",
            "X-MB-Token": source.signCookie,
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
          }),
        );

        //https://shy-rice-3f7d.gmail1.workers.dev/

        const proxyUrl = `https://tiny-night-3f17.gmail3.workers.dev/dash?url=${encodeURIComponent(url)}&header=${encodeURIComponent(header)}`;
        // const proxyUrl = `https://tiny-night-3f17.gmail3.workers.dev/dash?url=${encodeURIComponent(url)}&header=${encodeURIComponent(header)}`;
        return {
          type: "dash",
          link: encryptLink(proxyUrl),
          resolution: Number(source.resolutions?.split(",")[0]) || 0,
        };
      }),
    );

    logRequest(req, "MILKY WAY", 200, "OK");

    return NextResponse.json({
      success: true,
      links,
      dubs: publicDubs,
      cached: fromCache,
      server: path,
    });
  } catch {
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
