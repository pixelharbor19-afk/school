import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const GOOD_BASE = "https://goodstream.cc";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
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
  const e = embed.searchParams.get("e");

  if (!embedId) {
    return json({ error: "Could not extract embed ID" }, 400);
  }

  const { stdout: embedHtml } = await execFileAsync("curl", [
    "-sS",
    "-L",
    fullEmbedUrl,
    "-H",
    `User-Agent: ${HEADERS["User-Agent"]}`,
    "-H",
    `Accept-Language: ${HEADERS["Accept-Language"]}`,
    "-H",
    `Cache-Control: ${HEADERS["Cache-Control"]}`,
    "-H",
    "Accept: text/html,*/*",
    "-H",
    `Referer: ${fullEmbedUrl}`,
  ]);

  const csrfToken =
    embedHtml.match(/id="csrf_token"\s+value="([^"]+)"/)?.[1] || null;

  if (!csrfToken) {
    return json({ error: "csrf_token not found in embed page" }, 404);
  }

  const sourceRes = await fetch(fullEmbedUrl, {
    method: "POST",
    headers: {
      ...HEADERS,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      Accept: "application/json, */*; q=0.01",
      Referer: fullEmbedUrl,
    },
    body: new URLSearchParams({
      ...(e ? { e } : {}),
      token: csrfToken,
    }),
  });

  if (!sourceRes.ok) {
    return json({ error: `Source POST failed: HTTP ${sourceRes.status}` }, 502);
  }

  let sourceData: {
    success?: boolean;
    sources?: {
      file: string;
      label?: string;
      type?: string;
    }[];
  };

  try {
    sourceData = await sourceRes.json();
  } catch {
    return json({ error: "Source returned non-JSON" }, 502);
  }

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
    csrf_token: csrfToken,
    sources,
  });
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
