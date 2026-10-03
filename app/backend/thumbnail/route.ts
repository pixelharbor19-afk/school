import { ALLOWED_ORIGINS } from "@/lib/allowed-referers";
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { FIELD_MAP } from "@/lib/field-map";
import { logRequest } from "@/lib/log-request";
import { NextRequest, NextResponse } from "next/server";

const WORKER_URL = "https://autumn-cell-4c04.vetenabejar.workers.dev/";

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

  const title = searchParams.get(FIELD_MAP.title);
  const mediaType = searchParams.get(FIELD_MAP.mediaType) || "movie";
  const year = searchParams.get(FIELD_MAP.year);
  const season = searchParams.get(FIELD_MAP.season);
  const episode = searchParams.get(FIELD_MAP.episode);

  if (!title) {
    return NextResponse.json(
      {
        success: false,
        error: "title is required",
      },
      {
        status: 400,
        headers: corsHeaders,
      },
    );
  }
  if (mediaType === "tv" && (!season || !episode)) {
    return NextResponse.json(
      {
        success: false,
        error: "TV requires season and episode",
      },
      {
        status: 400,
        headers: corsHeaders,
      },
    );
  }
  try {
    const workerUrl = new URL(WORKER_URL);

    workerUrl.searchParams.set("title", title);
    workerUrl.searchParams.set("mediatype", mediaType);

    if (year) {
      workerUrl.searchParams.set("year", year);
    }

    if (mediaType === "tv") {
      workerUrl.searchParams.set("season", season!);
      workerUrl.searchParams.set("episode", episode!);
    }

    if (year) {
      workerUrl.searchParams.set("year", year);
    }
    const workerResponse = await fetchWithTimeout(workerUrl.toString(), {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const workerData: any = await workerResponse.json();

    if (!workerResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          status: workerResponse.status,
          data: workerData,
        },
        {
          status: workerResponse.status,
          headers: corsHeaders,
        },
      );
    }

    const thumbnailsUrl = workerData?.thumbnails;

    if (!thumbnailsUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "No thumbnails URL found",
        },
        {
          status: 404,
          headers: corsHeaders,
        },
      );
    }

    const vttResponse = await fetch(thumbnailsUrl, {
      signal: AbortSignal.timeout(15_000),
      headers: {
        Accept: "text/vtt,text/plain,*/*",
      },
      cache: "no-store",
    });

    if (!vttResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Thumbnail VTT request failed",
          status: vttResponse.status,
          url: thumbnailsUrl,
        },
        {
          status: vttResponse.status,
          headers: corsHeaders,
        },
      );
    }

    const vtt = await vttResponse.text();
    const baseUrl = new URL(thumbnailsUrl);

    const resolvedVtt = vtt
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();

        if (!trimmed || trimmed === "WEBVTT" || trimmed.includes("-->")) {
          return line;
        }

        const [imagePath, fragment] = trimmed.split("#");
        const imageUrl = new URL(imagePath, baseUrl);

        if (
          !imageUrl.pathname.endsWith(".jpg") &&
          !imageUrl.pathname.endsWith(".jpeg")
        ) {
          return line;
        }

        return fragment
          ? `${imageUrl.toString()}#${fragment}`
          : imageUrl.toString();
      })
      .join("\n");

    return new NextResponse(resolvedVtt, {
      status: 200,
      headers: {
        ...Object.fromEntries(corsHeaders.entries()),
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    logRequest(
      req,
      "PREVIEW",
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
