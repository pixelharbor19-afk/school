// app/api/subtitle/route.ts
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { NextRequest, NextResponse } from "next/server";

function normalizeTimestamps(input: string): string {
  return input
    .replace(/\r+/g, "")
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, (_, time, ms) => `${time}.${ms}`);
}

function applyLinePosition(vttBody: string, line: string): string {
  return vttBody.replace(
    /(\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3})(.*)$/gm,
    (_, timing, rest) => {
      // Strip any existing line/position/align settings before reapplying,
      // so re-processed VTTs don't accumulate duplicate settings.
      const cleanedRest = rest
        .replace(/\bline:\S+/g, "")
        .replace(/\bposition:\S+/g, "")
        .replace(/\balign:\S+/g, "")
        .trim();

      return `${timing} line:${line} align:center${cleanedRest ? " " + cleanedRest : ""}`;
    },
  );
}

function srtToVtt(srt: string, line: string): string {
  const body = normalizeTimestamps(srt);
  return `WEBVTT\n\n${applyLinePosition(body, line)}`;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const line = req.nextUrl.searchParams.get("line") || "-3";

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream fetch failed" },
        { status: 502 },
      );
    }

    const raw = await res.text();
    const isVtt = raw.trim().startsWith("WEBVTT");

    const vtt = isVtt
      ? `WEBVTT\n\n${applyLinePosition(normalizeTimestamps(raw.replace(/^WEBVTT\s*/, "")), line)}`
      : srtToVtt(raw, line);

    return new NextResponse(vtt, {
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
  }
}
