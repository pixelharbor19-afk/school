import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
type Source = { file: string; label?: string; type?: string };
type SourceResponse = { success?: boolean; sources?: Source[] };
const execFileAsync = promisify(execFile);

const GOOD_BASE = "https://goodstream.cc";
const RESIDENTIAL_PROXY = process.env.RESIDENTIAL_PROXY!;

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
      "--max-time",
      "10",
      "-x",
      RESIDENTIAL_PROXY,
      "-X",
      "POST",
      fullEmbedUrl,
      "-H",
      "Accept: application/json, text/plain, */*",
      "-H",
      "Content-Type: application/x-www-form-urlencoded",
      "-H",
      "Origin: https://goodstream.cc",
      "-H",
      `Referer: ${fullEmbedUrl}`,
      "-H",
      "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36",
      "--data",
      "",
    ]);

    const sourceData: SourceResponse = JSON.parse(stdout);

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
