import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const language = searchParams.get("language") || "en-US";
  const page = searchParams.get("page") || "1";

  const url = new URL("https://api.themoviedb.org/3/movie/popular");

  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  url.searchParams.set("language", language);
  url.searchParams.set("page", page);

  const response = await fetch(url);

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch popular movies" },
      { status: response.status },
    );
  }

  return NextResponse.json(await response.json());
}
