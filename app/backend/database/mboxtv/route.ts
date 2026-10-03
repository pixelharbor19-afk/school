import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { fetch, ProxyAgent } from "undici";

const residentialProxy = new ProxyAgent(process.env.RESIDENTIAL_PROXY!);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const GATEWAY_SECRET = "76iRl07s0xSN9jqmEWAt79EBJZulIQIsV64FZr2O";

const SIGN_METHOD = "HmacMD5";

const CLIENT_BUILD = "1788297245218911755.511c863ff4869beb449ece3a58f7927d";

const CLIENT_TOKEN = "1788297254101,851caa2588b85eb1464175c8a091eee2";

const TV_BASE = "https://tv.aoneroom.com/wefeed-tv-bff";

const BOTTOM_TAB_URLS = [
  "https://api3.aoneroom.com/wefeed-mobile-bff/subject-api/bottom-tab",
  "https://api6.aoneroom.com/wefeed-mobile-bff/subject-api/bottom-tab",
];

type PlayInfo = {
  streams?: Array<{
    url?: string;
    format?: string;
    signCookie?: string;
    resolutions?: string;
    quality?: string;
  }>;
  captions?: Array<{
    url?: string;
    language?: string;
    label?: string;
  }>;
};

type PlayInfoResponse = {
  data?: PlayInfo;
} & PlayInfo;

const TV_PROFILE = {
  packageName: "com.community.mbox.tv",
  versionName: "1.1.10.0901.03",
  versionCode: 50040016,
};

// ─────────────────────────────────────────────────────────────────────────────
// DEVICE
// ─────────────────────────────────────────────────────────────────────────────

let device = {
  deviceId: "",
  gaid: "",
  ts: 0,
};

function getDevice() {
  const now = Date.now();

  if (!device.deviceId || now - device.ts > 43_200_000) {
    device = {
      deviceId: crypto.randomBytes(16).toString("hex"),
      gaid: [4, 2, 2, 2, 6]
        .map((n) => crypto.randomBytes(n).toString("hex"))
        .join("-"),
      ts: now,
    };
  }

  return device;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT INFO
// ─────────────────────────────────────────────────────────────────────────────

function clientInfoPayload() {
  const dev = getDevice();

  return {
    package_name: TV_PROFILE.packageName,
    version_name: TV_PROFILE.versionName,
    version_code: TV_PROFILE.versionCode,

    os: "android",
    os_version: "11",

    install_ch: "ps",

    device_id: dev.deviceId,
    install_store: "ps",
    gaid: dev.gaid,

    brand: "google",
    model: "sdk_gphone_x86_64",

    system_language: "en",
    net: "NETWORK_WIFI",
    region: "US",
    timezone: "Africa/Lagos",

    sp_code: "20801",

    "X-Child-UID": "",
    "X-Client-Build": CLIENT_BUILD,
    "X-Play-Mode": "1",
    "X-Idle-Data": "1",
    "X-Family-Mode": "0",
    "X-Content-Mode": "0",
  };
}

function commonHeaders() {
  return {
    "user-agent": "okhttp/4.12.0",

    "x-client-info": JSON.stringify(clientInfoPayload()),

    "x-child-uid": "",
    "x-client-build": CLIENT_BUILD,
    "x-client-status": "1",
    "x-content-mode": "0",
    "x-family-mode": "0",
    "x-idle-data": "1",
    "x-play-mode": "1",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNING
// ─────────────────────────────────────────────────────────────────────────────

function bodyMd5(body: string) {
  if (!body) return "";

  return crypto
    .createHash("md5")
    .update(Buffer.from(body, "utf8").subarray(0, 102400))
    .digest("hex");
}

function normalizeQuery(query: string) {
  if (!query) return "";

  const pairs: [string, string][] = [];

  for (const pair of query.split("&")) {
    if (!pair) continue;

    const index = pair.indexOf("=");

    const key = index === -1 ? pair : pair.slice(0, index);

    const value = index === -1 ? "" : pair.slice(index + 1);

    try {
      pairs.push([
        decodeURIComponent(key.replace(/\+/g, " ")),
        decodeURIComponent(value.replace(/\+/g, " ")),
      ]);
    } catch {
      pairs.push([key, value]);
    }
  }

  pairs.sort((a, b) => a[0].localeCompare(b[0]));

  return pairs.map(([key, value]) => `${key}=${value}`).join("&");
}

function buildCanonical(
  method: string,
  headers: Record<string, string>,
  body: string,
  fullUrl: string,
  timestamp: number,
) {
  const url = new URL(fullUrl);

  const accept = headers["accept"] ?? "";

  const contentType = headers["content-type"] ?? "";

  let contentLength = headers["content-length"] ?? "";

  if (!contentLength && body) {
    contentLength = String(Buffer.byteLength(body, "utf8"));
  }

  if (method.toUpperCase() === "GET" && !body) {
    contentLength = "";
  }

  const query = normalizeQuery(url.search.replace("?", ""));

  const path = url.pathname + (query ? `?${query}` : "");

  return [
    method.toUpperCase(),
    accept,
    contentType,
    contentLength,
    String(timestamp),
    bodyMd5(body),
    path,
  ].join("\n");
}

function createSignature(
  method: string,
  url: string,
  headers: Record<string, string>,
  body = "",
) {
  const timestamp = Date.now();

  const canonical = buildCanonical(method, headers, body, url, timestamp);

  const key = Buffer.from(GATEWAY_SECRET, "base64");

  const signature = crypto
    .createHmac("md5", key)
    .update(canonical, "utf8")
    .digest("base64");

  return `${timestamp}|2|${signature}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// JWT
// ─────────────────────────────────────────────────────────────────────────────

let jwtCache = "";
let jwtExpiresAt = 0;

async function fetchJwt() {
  for (const url of BOTTOM_TAB_URLS) {
    const headers: Record<string, string> = {
      accept: "*/*",
      connection: "keep-alive",
      "user-agent": "okhttp/4.12.0",

      "x-client-info": JSON.stringify(clientInfoPayload()),

      "x-child-uid": "",
      "x-client-build": CLIENT_BUILD,
      "x-client-status": "1",
      "x-client-token": CLIENT_TOKEN,
      "x-content-mode": "0",
      "x-family-mode": "0",
      "x-idle-data": "1",
      "x-play-mode": "1",
    };

    headers["x-tr-signature"] = createSignature("GET", url, headers);

    headers["x-tr-signature-method"] = SIGN_METHOD;

    try {
      const response = await fetch(url, {
        dispatcher: residentialProxy,
        headers,
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });

      if (!response.ok) continue;

      const xUser = response.headers.get("x-user");

      if (!xUser) continue;

      try {
        const parsed = JSON.parse(xUser);

        if (parsed?.token) {
          return `Bearer ${parsed.token}`;
        }
      } catch {}

      try {
        const parsed = JSON.parse(decodeURIComponent(xUser));

        if (parsed?.token) {
          return `Bearer ${parsed.token}`;
        }
      } catch {}

      return xUser.startsWith("Bearer ") ? xUser : `Bearer ${xUser}`;
    } catch {}
  }

  return null;
}

async function getJwt() {
  if (jwtCache && Date.now() < jwtExpiresAt) {
    return jwtCache;
  }

  const token = await fetchJwt();

  if (!token) {
    throw new Error("Failed to obtain MovieBox JWT");
  }

  jwtCache = token;

  // Refresh before expiration.
  jwtExpiresAt = Date.now() + 30 * 60 * 1000;

  return token;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOVIEBOX PLAY INFO
// ─────────────────────────────────────────────────────────────────────────────

async function getPlayInfo(
  subjectId: string,
  season?: number,
  episode?: number,
): Promise<PlayInfoResponse> {
  const params = new URLSearchParams();

  params.set("subjectId", subjectId);

  if (season !== undefined) {
    params.set("se", String(season));
  }

  if (episode !== undefined) {
    params.set("ep", String(episode));
  }

  const url = `${TV_BASE}/subject/play-info/v2?${params}`;

  const makeRequest = async (token: string) => {
    const signingHeaders = {
      accept: "application/json",
      "content-type": "",
    };

    const headers: Record<string, string> = {
      ...commonHeaders(),

      accept: "application/json",

      Authorization: token,

      "x-tr-signature": createSignature("GET", url, signingHeaders),

      "x-tr-signature-method": SIGN_METHOD,
    };

    return fetch(url, {
      dispatcher: residentialProxy,
      headers,
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
  };

  let token = await getJwt();

  let response = await makeRequest(token);

  // JWT expired → refresh once.
  if (response.status === 401 || response.status === 403) {
    jwtCache = "";
    jwtExpiresAt = 0;

    token = await getJwt();

    response = await makeRequest(token);
  }

  if (!response.ok) {
    throw new Error(`MovieBox play-info failed: ${response.status}`);
  }

  return response.json() as Promise<PlayInfoResponse>;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACT DASH
// ─────────────────────────────────────────────────────────────────────────────

async function extractDash(
  subjectId: string,
  season?: number,
  episode?: number,
) {
  const data = await getPlayInfo(subjectId, season, episode);

  const playInfo = data?.data ?? data;

  const streams = Array.isArray(playInfo?.streams) ? playInfo.streams : [];

  const dashStreams = streams.filter((stream: any) => {
    const format = String(stream?.format ?? "").toUpperCase();

    const url = String(stream?.url ?? "");

    return url && (format === "DASH" || url.includes(".mpd"));
  });

  const subtitles = Array.isArray(playInfo?.captions)
    ? playInfo.captions
        .filter((caption: any) => caption?.url)
        .map((caption: any) => ({
          url: caption.url,
          language: caption.language || caption.label || "en",
        }))
    : [];

  return {
    subjectId,

    streams: dashStreams.map((stream: any) => ({
      url: stream.url,

      rawUrl: stream.url,

      signCookie: stream.signCookie || "",

      quality: stream.resolutions || stream.quality || "auto",

      format: "dash",
    })),

    subtitles,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const subjectId = searchParams.get("subjectId");

    const seasonParam = searchParams.get("season");

    const episodeParam = searchParams.get("episode");

    if (!subjectId) {
      return NextResponse.json(
        {
          error: "Missing subjectId",
        },
        {
          status: 400,
        },
      );
    }

    const season = seasonParam ? Number(seasonParam) : undefined;

    const episode = episodeParam ? Number(episodeParam) : undefined;

    if (season !== undefined && !Number.isInteger(season)) {
      return NextResponse.json(
        {
          error: "Invalid season",
        },
        {
          status: 400,
        },
      );
    }

    if (episode !== undefined && !Number.isInteger(episode)) {
      return NextResponse.json(
        {
          error: "Invalid episode",
        },
        {
          status: 400,
        },
      );
    }

    const result = await extractDash(subjectId, season, episode);

    if (result.streams.length === 0) {
      return NextResponse.json(
        {
          error: "No DASH stream found",
          ...result,
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[MovieBox DASH]", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}
