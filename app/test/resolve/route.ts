import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const GOOD_BASE = "https://goodstream.cc";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "max-age=0",
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function GET(request: NextRequest) {
  const embedUrl = request.nextUrl.searchParams.get("embed_url");

  if (!embedUrl) {
    return json({ error: 'Missing "embed_url"' }, 400);
  }

  const fullEmbedUrl = embedUrl.startsWith("http")
    ? embedUrl
    : `${GOOD_BASE}${embedUrl}`;

  const embed = new URL(fullEmbedUrl);

  const embedId = embed.pathname.split("/").pop();

  if (!embedId) {
    return json({ error: "Could not extract embed ID" }, 400);
  }

  try {
    const { stdout } = await execFileAsync("curl", [
      "-sS",
      "-L",
      "-X",
      "POST",
      fullEmbedUrl,
      "-H",
      `Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8`,
      "-H",
      `Accept-Language: ${HEADERS["Accept-Language"]}`,
      "-H",
      `Cache-Control: ${HEADERS["Cache-Control"]}`,
      "-H",
      "Content-Type: application/x-www-form-urlencoded",
      "-H",
      "Origin: https://goodstream.cc",
      "-H",
      `Referer: ${fullEmbedUrl}`,
      "-H",
      "Sec-Fetch-Dest: document",
      "-H",
      "Sec-Fetch-Mode: navigate",
      "-H",
      "Sec-Fetch-Site: same-origin",
      "-H",
      "Sec-Fetch-User: ?1",
      "-H",
      "Upgrade-Insecure-Requests: 1",
      "-H",
      `User-Agent: ${HEADERS["User-Agent"]}`,
      "--data",
      "",
    ]);

    const sourceData: {
      success?: boolean;
      sources?: {
        file: string;
        label?: string;
        type?: string;
      }[];
    } = JSON.parse(stdout);

    if (!sourceData.success) {
      return json(
        {
          error: "Source request unsuccessful",
          raw: sourceData,
        },
        502,
      );
    }

    const sources = (sourceData.sources || []).map((s) => {
      let file = s.file;

      if (file.startsWith("//")) {
        file = "https:" + file;
      } else if (file.startsWith("/")) {
        file = GOOD_BASE + file;
      }

      return {
        label: s.label,
        type: s.type,
        file,
      };
    });

    return json({
      embed_id: embedId,
      sources,
    });
  } catch (error) {
    return json(
      {
        error: "Curl request failed",
        details: error instanceof Error ? error.message : String(error),
      },
      502,
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    },
  });
}
