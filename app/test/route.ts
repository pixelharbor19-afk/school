import { NextRequest, NextResponse } from "next/server";
import { fetch, ProxyAgent } from "undici";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query") || "";

  const residentialProxy = new ProxyAgent(process.env.RESIDENTIAL_PROXY!);

  const response = await fetch(
    "https://hollymoviehd.cc/wp-admin/admin-ajax.php",
    {
      method: "POST",
      dispatcher: residentialProxy,
      headers: {
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.7",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Origin: "https://hollymoviehd.cc",
        Referer: "https://hollymoviehd.cc/the-wild-robot-2024/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: new URLSearchParams({
        s: query,
        action: "searchwp_live_search",
        swpengine: "default",
        swpquery: query,
      }),
    },
  );

  const html = await response.text();

  const results = html
    .match(/<li>([\s\S]*?)<\/li>/g)
    ?.map((item) => {
      const url = item.match(/class="thumb"[^>]*href="([^"]+)"/)?.[1];

      const title = item.match(/class="ss-title"[^>]*>([\s\S]*?)<\/a>/)?.[1];

      const info = item.match(/<p>([\s\S]*?)<\/p>/)?.[1];

      if (!title) return null;

      return {
        title: title.trim(),
        url,
        info: info?.trim(),
      };
    })
    .filter(Boolean);

  return NextResponse.json(results || []);
}
