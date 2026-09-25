import { NextRequest, NextResponse } from "next/server";
import { fetch, ProxyAgent } from "undici";

const HOLLY_BASE = "https://hollymoviehd.cc";
const HOLLY_AJAX = `${HOLLY_BASE}/wp-admin/admin-ajax.php`;

const residentialProxy = new ProxyAgent(process.env.RESIDENTIAL_PROXY!);

const HOLLY_HEADERS = {
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

function buildHollyUrl(slug: string) {
  const clean = slug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^\/|\/$/g, "");

  if (/season-\d+-episode-\d+/i.test(clean)) {
    return `${HOLLY_BASE}/episode/${clean}/`;
  }

  if (/season-\d+/i.test(clean)) {
    return `${HOLLY_BASE}/series/${clean}/`;
  }

  return `${HOLLY_BASE}/${clean}/`;
}
export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug");

    if (!slug) {
      return json({ error: 'Missing "slug"' }, 400);
    }

    const pageUrl = buildHollyUrl(slug);

    const pageRes = await fetch(pageUrl, {
      dispatcher: residentialProxy,
      headers: {
        ...HOLLY_HEADERS,
        Accept: "text/html,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (pageRes.status === 429) {
      return json({ error: "Rate limited" }, 429);
    }

    if (!pageRes.ok) {
      return json({ error: `Page fetch failed: HTTP ${pageRes.status}` }, 404);
    }

    const html = await pageRes.text();

    const streamkey = html.match(/data-streamkey="([^"]+)"/)?.[1] || null;
    const nonce = html.match(/data-wpnonce="([^"]+)"/)?.[1] || null;
    const imdbid = html.match(/data-imdbid="(tt\d+)"/)?.[1] || null;

    if (!streamkey) {
      return json({ error: "streamkey not found" }, 404);
    }

    if (!nonce) {
      return json({ error: "nonce not found" }, 404);
    }

    const ajaxRes = await fetch(HOLLY_AJAX, {
      dispatcher: residentialProxy,
      method: "POST",
      headers: {
        ...HOLLY_HEADERS,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json, */*; q=0.01",
        Referer: pageUrl,
        Origin: HOLLY_BASE,
      },
      body: new URLSearchParams({
        action: "ajax_getlinkstream",
        streamkey,
        nonce,
        ...(imdbid ? { imdbid } : {}),
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (ajaxRes.status === 429) {
      return json({ error: "Rate limited" }, 429);
    }

    if (!ajaxRes.ok) {
      return json({ error: `ajax POST failed: HTTP ${ajaxRes.status}` }, 502);
    }

    let ajaxData: {
      servers_iframe?: Record<string, string>;
    };

    try {
      ajaxData = (await ajaxRes.json()) as {
        servers_iframe?: Record<string, string>;
      };
    } catch {
      return json({ error: "ajax returned non-JSON" }, 502);
    }

    const qualities = Object.entries(ajaxData.servers_iframe || {}).map(
      ([name, embed_url]) => ({
        quality: name,
        embed_url,
      }),
    );

    return json({
      slug,
      pageUrl,
      streamkey,
      nonce,
      imdbid,
      qualities,
    });
  } catch (error) {
    console.error(
      `[HOLLY] ${error instanceof Error ? error.message : "Request failed"}`,
    );
    return json({ error: "Request failed" }, 502);
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
