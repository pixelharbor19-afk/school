// /backend/atlas/edge
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");

  if (!target) {
    return new Response("Missing url", { status: 400 });
  }

  const url = new URL(target);

  const response = await fetch(url, {
    headers: {
      Referer: `https://goodstream.cc/embed/${url.pathname.split("/")[2]}`,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36",
    },
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") || "application/vnd.apple.mpegurl",
    },
  });
}
