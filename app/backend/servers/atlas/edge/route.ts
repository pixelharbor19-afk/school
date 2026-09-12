// /backend/atlas/edge/route.ts
import { NextRequest } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  const domain = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  if (!target) {
    return new Response("Missing url", { status: 400 });
  }

  const url = new URL(target);
  const embedId = url.pathname.split("/")[2];

  try {
    const { stdout } = await execFileAsync("curl", [
      "-sS",
      "--compressed",
      url.toString(),
      "-H",
      "Accept: */*",
      "-H",
      "Origin: https://goodstream.cc",
      "-H",
      `Referer: https://goodstream.cc/embed/${embedId}`,
      "-H",
      `User-Agent: ${USER_AGENT}`,
    ]);

    const playlist = stdout
      .split(/\r?\n/)
      .map((line) => {
        const value = line.trim();

        if (
          value.startsWith("https://goodstream.cc/pl/") ||
          value.startsWith("https://www.goodstream.cc/pl/")
        ) {
          return `${domain}/backend/servers/atlas/edge?url=${encodeURIComponent(value)}`;
        }

        return line;
      })
      .join("\n");

    return new Response(playlist, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
      },
    });
  } catch {
    return new Response("Upstream error", { status: 502 });
  }
}
