import { NextRequest, NextResponse } from "next/server";
import { fetch, ProxyAgent } from "undici";

const residentialProxy = new ProxyAgent(process.env.RESIDENTIAL_PROXY!);

function decode(parts: string[]): string {
  const arr = [...parts];
  let len = arr.length - 2;
  const a = len % 7;
  const b = 8 + (len % 5);

  const key1 = arr.splice(b, 1)[0];
  const key2 = arr.splice(a, 1)[0];
  let s = arr.join("");

  if (key2.length > 4096) s = Buffer.from(s, "base64").toString("binary");

  let x = 0,
    y = 0;
  for (let i = 0; i < key2.length; i++) {
    const c = key2.charCodeAt(i);
    x = (x * 37 + c) % 241;
    y = (y + ((c << 1) ^ i)) & 255;
  }

  const seed = (x * 3 + y) % 256;
  const step = (y % 11) + 5;
  let prng = ((y * 251 + x) % 65519) + 1;

  for (let i = key1.length - 1; i >= 0; i--) {
    const ch = key1[i];
    if (ch === "7") s = Buffer.from(s, "base64").toString("binary");
    else if (ch === "3") s = s.split("").reverse().join("");
    else {
      const shift = (26 - ((ch.charCodeAt(0) - 96) % 26)) % 26;
      s = s.replace(/[a-zA-Z]/g, (c) => {
        const code = c.charCodeAt(0);
        const base = code <= 90 ? 65 : 97;
        return String.fromCharCode(((code - base + shift) % 26) + base);
      });
    }
  }

  if (key1.length > 2048) s = s.split("").reverse().join("");

  len = s.length;
  const idx: number[] = [];
  for (let i = len - 1; i >= 1; i--) {
    prng = (prng * 97 + 41) % 65519;
    idx[i] = prng % (i + 1);
  }

  const chars = s.split("");
  for (let i = 1; i < len; i++) {
    const j = idx[i];
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  s = chars.join("");

  let state = seed;
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    state = (state * 5 + step) % 256;
    out += String.fromCharCode(c ^ state);
    state = (state + c) % 256;
  }
  return out;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const response = await fetch(url, {
    dispatcher: residentialProxy,
    signal: AbortSignal.timeout(15_000),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36",
      Referer: "https://ridomovie.to/",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    return NextResponse.json(
      { error: `upstream returned ${response.status}` },
      { status: 502 },
    );
  }
  const html = await response.text();

  const m = html.match(
    /var\s+\w+\s*=\s*\w+\s*\(\s*"([^"]+)"\s*\.\s*split\s*\(\s*"([^"]+)"\s*\)\s*\)/,
  );

  if (!m) {
    return NextResponse.json(
      { error: "source not found", html },
      { status: 404 },
    );
  }

  const source = decode(m[1].split(m[2]));

  return NextResponse.json({ source });
}
