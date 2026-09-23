import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ALLOWED_ORIGINS } from "@/lib/allowed-referers";
import { FIELD_MAP } from "@/lib/field-map";

const SECRET = process.env.API_SECRET!;

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || "";

  if (!ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }

  const body = await req.json();

  const id = body[FIELD_MAP.id];
  const media_type = body[FIELD_MAP.mediaType];
  const season = body[FIELD_MAP.season];
  const episode = body[FIELD_MAP.episode];
  const path = body[FIELD_MAP.path];

  if (!id || !media_type || !path) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 },
    );
  }

  const ts = Date.now();

  let payload: string;

  if (media_type === "tv") {
    payload = [id, media_type, season ?? "1", episode ?? "1", path, ts].join(
      ":",
    );
  } else {
    payload = [id, media_type, path, ts].join(":");
  }

  const token = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");

  const response = NextResponse.json({
    token,
    ts,
  });

  return response;
}
