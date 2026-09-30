import { NextRequest } from "next/server";

function encode(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

  return Buffer.from(padded, "base64").toString("utf8");
}

function getCorsOrigin(request: NextRequest) {
  const origin = request.headers.get("Origin");

  if (!origin) return null;

  try {
    const hostname = new URL(origin).hostname;

    if (
      hostname.includes("vidstuck") ||
      hostname.includes("localhost") ||
      hostname.includes("zxcstream") ||
      hostname.includes("zxcprime") ||
      hostname.includes("mnflix")
    ) {
      return origin;
    }
  } catch {}

  return null;
}

export async function OPTIONS(request: NextRequest) {
  const corsOrigin = getCorsOrigin(request);

  if (!corsOrigin) {
    return new Response("Forbidden", { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type",
      "Access-Control-Expose-Headers":
        "Content-Length, Content-Range, Accept-Ranges",
    },
  });
}

export async function GET(request: NextRequest) {
  const corsOrigin = getCorsOrigin(request);

  if (request.headers.get("Origin") && !corsOrigin) {
    return new Response("Forbidden", { status: 403 });
  }

  const urlParam = request.nextUrl.searchParams.get("u");
  const segmentParam = request.nextUrl.searchParams.get("y");
  const headerParam = request.nextUrl.searchParams.get("h");

  let url: string | null = null;
  let segment: string | null = null;
  let headers = new Headers();

  try {
    if (urlParam) {
      url = decode(urlParam);
    }

    if (segmentParam) {
      segment = decode(segmentParam);
    }

    if (headerParam) {
      headers = new Headers(JSON.parse(decode(headerParam)));
    }
  } catch {
    return new Response("Invalid encoded data", {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin || "null",
      },
    });
  }

  const target = url || segment;

  if (!target) {
    return new Response("Missing url", {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": corsOrigin || "null",
      },
    });
  }

  const range = request.headers.get("Range");

  if (range) {
    headers.set("Range", range);
  }

  try {
    const response = await fetch(target, {
      headers,
    });

    if (!response.ok) {
      return new Response(
        `Fetch failed: ${response.status} ${response.statusText}`,
        {
          status: response.status,
          headers: {
            "Access-Control-Allow-Origin": corsOrigin || "null",
          },
        },
      );
    }

    const contentType = response.headers.get("content-type") || "";

    /*
     * HLS playlist
     */
    if (
      url ||
      contentType.includes("mpegurl") ||
      contentType.includes("m3u8")
    ) {
      const text = await response.text();

      if (text.trim().startsWith("#EXTM3U")) {
        const baseUrl = new URL(target);
        const lines = text.split("\n");
        const playlist: string[] = [];

        const encodedHeaders = encode(
          JSON.stringify(Object.fromEntries(headers.entries())),
        );

        const proxyOrigin = `${request.nextUrl.protocol}//${request.headers.get(
          "host",
        )}`;

        for (let line of lines) {
          line = line.trim();

          if (!line) {
            playlist.push(line);
            continue;
          }

          /*
           * URI="..." inside HLS tags
           */
          if (line.startsWith("#")) {
            const matches = [...line.matchAll(/URI="([^"]+)"/g)];

            for (const match of matches) {
              const absoluteUrl = new URL(match[1], baseUrl).href;
              const encodedUrl = encode(absoluteUrl);

              line = line.replace(
                match[1],
                `${proxyOrigin}/a?y=${encodeURIComponent(
                  encodedUrl,
                )}&h=${encodeURIComponent(encodedHeaders)}`,
              );
            }

            playlist.push(line);
            continue;
          }

          /*
           * Normal HLS segment / playlist URL
           */
          const absoluteUrl = new URL(line, baseUrl).href;
          const encodedUrl = encode(absoluteUrl);

          playlist.push(
            `${proxyOrigin}/a?y=${encodeURIComponent(
              encodedUrl,
            )}&h=${encodeURIComponent(encodedHeaders)}`,
          );
        }

        return new Response(playlist.join("\n"), {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": corsOrigin || "null",
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "no-cache",
          },
        });
      }

      return new Response(text, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          "Access-Control-Allow-Origin": corsOrigin || "null",
          "Content-Type": contentType || "application/octet-stream",
        },
      });
    }

    /*
     * HLS segment
     */
    const responseHeaders = new Headers();

    responseHeaders.set("Access-Control-Allow-Origin", corsOrigin || "null");

    responseHeaders.set(
      "Access-Control-Expose-Headers",
      "Content-Length, Content-Range, Accept-Ranges",
    );

    const segmentContentType = response.headers.get("content-type");

    if (segmentContentType) {
      responseHeaders.set("Content-Type", segmentContentType);
    }

    const contentRange = response.headers.get("content-range");

    if (contentRange) {
      responseHeaders.set("Content-Range", contentRange);
    }

    responseHeaders.set("Accept-Ranges", "bytes");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(
      `Fetch failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": corsOrigin || "null",
        },
      },
    );
  }
}
