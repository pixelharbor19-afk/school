import { NextResponse } from "next/server";
import { fetch, FormData } from "undici";

const EMBED_URL =
  "https://goodstream.cc/embed/W3cPjhjEzF?e=S3ZjdmxnTFY4MExOOWdEeGZDbGZDb2hIUFlmWTIyZ3JIU2phaXNuYTNCTT0A";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36";

export async function GET() {
  const embed = new URL(EMBED_URL);
  const e = embed.searchParams.get("e");

  const embedResponse = await fetch(EMBED_URL, {
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Referer: EMBED_URL,
      "User-Agent": USER_AGENT,
    },
  });

  if (!embedResponse.ok) {
    return NextResponse.json(
      {
        error: `Embed GET failed: HTTP ${embedResponse.status}`,
      },
      { status: 502 },
    );
  }

  const html = await embedResponse.text();

  const csrfToken =
    html.match(/id="csrf_token"\s+value="([^"]+)"/)?.[1] || null;

  if (!csrfToken) {
    return NextResponse.json(
      { error: "csrf_token not found" },
      { status: 404 },
    );
  }

  const form = new FormData();

  form.append("e", e || "");
  form.append("token", csrfToken);

  const sourceResponse = await fetch(EMBED_URL, {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Origin: "https://goodstream.cc",
      Referer: EMBED_URL,
      "User-Agent": USER_AGENT,
    },
    body: form,
  });

  const sourceText = await sourceResponse.text();

  if (!sourceResponse.ok) {
    return NextResponse.json(
      {
        error: `Source POST failed: HTTP ${sourceResponse.status}`,
        response: sourceText,
      },
      { status: 502 },
    );
  }

  try {
    return NextResponse.json(JSON.parse(sourceText));
  } catch {
    return NextResponse.json(
      {
        error: "Source returned non-JSON",
        response: sourceText,
      },
      { status: 502 },
    );
  }
}
