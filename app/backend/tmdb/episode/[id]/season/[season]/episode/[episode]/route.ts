import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { NextResponse } from "next/server";

const SUPPORTED_LANGUAGES: Record<string, string> = {
  xx: "en-US",
  ar: "ar-SA",
  be: "be-BY",
  bg: "bg-BG",
  bn: "bn-BD",
  ca: "ca-ES",
  cs: "cs-CZ",
  da: "da-DK",
  de: "de-DE",
  el: "el-GR",
  en: "en-US",
  eo: "eo-EO",
  es: "es-ES",
  eu: "eu-ES",
  fa: "fa-IR",
  fi: "fi-FI",
  fr: "fr-FR",
  ga: "ga-IE",
  gl: "gl-ES",
  he: "he-IL",
  hi: "hi-IN",
  hr: "hr-HR",
  hu: "hu-HU",
  id: "id-ID",
  it: "it-IT",
  ja: "ja-JP",
  ka: "ka-GE",
  kk: "kk-KZ",
  kn: "kn-IN",
  ko: "ko-KR",
  lt: "lt-LT",
  lv: "lv-LV",
  ml: "ml-IN",
  ms: "ms-MY",
  nb: "nb-NO",
  nl: "nl-NL",
  no: "no-NO",
  pa: "pa-IN",
  pl: "pl-PL",
  pt: "pt-BR",
  ro: "ro-RO",
  ru: "ru-RU",
  sk: "sk-SK",
  sl: "sl-SI",
  sq: "sq-AL",
  sr: "sr-RS",
  sv: "sv-SE",
  ta: "ta-IN",
  te: "te-IN",
  th: "th-TH",
  tl: "tl-PH",
  tr: "tr-TR",
  uk: "uk-UA",
  ur: "ur-PK",
  vi: "vi-VN",
  zh: "zh-CN",
  zu: "zu-ZA",
};

const VALID_LANGUAGE_VALUES = new Set(Object.values(SUPPORTED_LANGUAGES));

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      season: string;
      episode: string;
    }>;
  },
) {
  const { id, season, episode } = await params;
  const { searchParams } = new URL(req.url);
  const rawLanguage = searchParams.get("language") || "en-US";

  const language = VALID_LANGUAGE_VALUES.has(rawLanguage)
    ? rawLanguage
    : "en-US";

  const url = `https://api.themoviedb.org/3/tv/${id}/season/${season}/episode/${episode}?api_key=47a1a7df542d3d483227f758a7317dff&language=${encodeURIComponent(language)}`;

  let res: Response;

  try {
    res = await fetchWithTimeout(url, { cache: "no-store" }, 8000);
  } catch (err) {
    console.error(
      `[TMDB EPISODE] ${id}/season/${season}/episode/${episode} | ${
        err instanceof Error ? err.message : "fetch failed"
      }`,
    );

    return NextResponse.json(
      { message: "Failed to fetch episode" },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { message: "Failed to fetch episode" },
      { status: res.status },
    );
  }

  const data = await res.json();

  const filtered = {
    id: data.id,
    episode_number: data.episode_number,
    season_number: data.season_number,
    name: data.name,
    overview: data.overview,
    runtime: data.runtime,
    still_path: data.still_path,
    air_date: data.air_date,
    vote_average: data.vote_average,
  };

  return NextResponse.json(filtered);
}
