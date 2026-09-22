import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const EMBED_URL =
  "https://goodstream.cc/embed/W3cPjhjEzF?e=S3ZjdmxnTFY4MExOOWdEeGZDbGZDb2hIUFlmWTIyZ3JIU2phaXNuYTNCTT0A";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36";

function curl(args: string[]) {
  return execFileAsync("curl", args, {
    maxBuffer: 10 * 1024 * 1024,
  });
}

export async function GET() {
  const embed = new URL(EMBED_URL);
  const e = embed.searchParams.get("e");

  const { stdout: html } = await curl([
    "-sS",
    "-L",
    EMBED_URL,
    "-H",
    "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "-H",
    "Accept-Language: en-US,en;q=0.9",
    "-H",
    "Cache-Control: no-cache",
    "-H",
    "Pragma: no-cache",
    "-H",
    `Referer: ${EMBED_URL}`,
    "-H",
    `User-Agent: ${USER_AGENT}`,
  ]);

  const csrfToken =
    html.match(/id="csrf_token"\s+value="([^"]+)"/)?.[1] || null;

  if (!csrfToken) {
    return NextResponse.json(
      { error: "csrf_token not found" },
      { status: 404 },
    );
  }

  const { stdout: sourceText } = await curl([
    "-sS",
    "-L",
    "-X",
    "POST",
    EMBED_URL,
    "-H",
    "Accept: */*",
    "-H",
    "Accept-Language: en-US,en;q=0.9",
    "-H",
    "Origin: https://goodstream.cc",
    "-H",
    `Referer: ${EMBED_URL}`,
    "-H",
    `User-Agent: ${USER_AGENT}`,
    "-F",
    `e=${e || ""}`,
    "-F",
    `token=${csrfToken}`,
  ]);

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
