import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL_TRACKER!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_TRACKER!,
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("embedders")
      .select("*")
      .order("last_seen", { ascending: false });

    if (error) {
      throw error;
    }

    const embedders = data.map((row) => ({
      ...row,
      status:
        Date.now() - new Date(row.last_seen).getTime() < 24 * 60 * 60 * 1000
          ? "Active"
          : "Inactive",
    }));

    return NextResponse.json({
      success: true,
      embedders,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing body",
        },
        { status: 400 },
      );
    }

    let embed: string, embedder: string, sandbox: boolean;

    try {
      const decoded = Buffer.from(data, "base64").toString("utf-8");
      ({ embed, embedder, sandbox } = JSON.parse(decoded));
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payload encoding",
        },
        { status: 400 },
      );
    }

    if (!embed || !embedder) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      );
    }

    const { error } = await supabase.rpc("track_embedder", {
      p_embed: embed,
      p_embedder: embedder,
      p_sandbox: sandbox ?? false,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 },
    );
  }
}
