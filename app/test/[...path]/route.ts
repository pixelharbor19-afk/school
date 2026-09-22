import { NextRequest, NextResponse } from "next/server";

const HOLLY_BASE = "https://hollymoviehd.cc";
const HOLLY_AJAX = `${HOLLY_BASE}/wp-admin/admin-ajax.php`;
const GOOD_BASE = "https://goodstream.cc";

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
  const clean = slug.replace(/^\/|\/$/g, "");

  return /season-\d+-episode-\d+/i.test(clean)
    ? `${HOLLY_BASE}/episode/${clean}/`
    : `${HOLLY_BASE}/${clean}/`;
}

async function handleScrape(url: URL) {
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return json({ error: 'Missing "slug"' }, 400);
  }

  const pageUrl = buildHollyUrl(slug);

  const pageRes = await fetch(pageUrl, {
    headers: {
      ...HOLLY_HEADERS,
      Accept: "text/html,*/*;q=0.8",
    },
  });

  if (pageRes.status === 429) {
    return json({ error: "Rate limited" }, 429);
  }

  if (!pageRes.ok) {
    return json({ error: `Page fetch failed: HTTP ${pageRes.status}` }, 502);
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
    ajaxData = await ajaxRes.json();
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
}

async function handleResolve(url: URL) {
  const embedUrl = url.searchParams.get("embed_url");

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

  const embedRes = await fetch(fullEmbedUrl, {
    headers: {
      ...HOLLY_HEADERS,
      Accept: "text/html,*/*",
      Referer: fullEmbedUrl,
    },
  });

  if (!embedRes.ok) {
    return json(
      {
        error: `Embed page fetch failed: HTTP ${embedRes.status}`,
      },
      502,
    );
  }

  const embedHtml = await embedRes.text();

  const csrfToken =
    embedHtml.match(/id="csrf_token"\s+value="([^"]+)"/)?.[1] || null;

  if (!csrfToken) {
    return json({ error: "csrf_token not found in embed page" }, 404);
  }

  const sourceRes = await fetch(fullEmbedUrl, {
    method: "POST",
    headers: {
      ...HOLLY_HEADERS,
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

export async function GET(request: NextRequest) {
  const url = request.nextUrl;

  if (url.pathname.endsWith("/scrape")) {
    return handleScrape(url);
  }

  if (url.pathname.endsWith("/resolve")) {
    return handleResolve(url);
  }

  return json({
    routes: {
      "/test/scrape?slug=...": "Holly scraper",
      "/test/resolve?embed_url=...": "Goodstream resolver",
    },
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
