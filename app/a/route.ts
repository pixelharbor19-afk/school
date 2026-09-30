import { NextRequest } from "next/server";
import { encryptUrl, decryptUrl } from "@/lib/aes-encryptor";

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
      url = await decryptUrl(urlParam);
    }

    if (segmentParam) {
      segment = await decryptUrl(segmentParam);
    }

    if (headerParam) {
      const decryptedHeaders = await decryptUrl(headerParam);
      headers = new Headers(JSON.parse(decryptedHeaders));
    }
  } catch {
    return new Response("Invalid encrypted data", {
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
    // VPS → upstream
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

              const encryptedUrl = await encryptUrl(absoluteUrl);

              const encryptedHeaders = await encryptUrl(
                JSON.stringify(Object.fromEntries(headers.entries())),
              );

              line = line.replace(
                match[1],
                `${request.nextUrl.origin}/a?y=${encodeURIComponent(
                  encryptedUrl,
                )}&h=${encodeURIComponent(encryptedHeaders)}`,
              );
            }

            playlist.push(line);
            continue;
          }

          /*
           * Normal HLS segment / playlist URL
           */
          const absoluteUrl = new URL(line, baseUrl).href;

          const encryptedUrl = await encryptUrl(absoluteUrl);

          const encryptedHeaders = await encryptUrl(
            JSON.stringify(Object.fromEntries(headers.entries())),
          );

          playlist.push(
            `${request.nextUrl.origin}/a?y=${encodeURIComponent(
              encryptedUrl,
            )}&h=${encodeURIComponent(encryptedHeaders)}`,
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
