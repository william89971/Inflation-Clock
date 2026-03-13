import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { AFFILIATE_PARTNERS } from "@/config/affiliates";

export async function POST(req: Request) {
  try {
    const sb = getSupabaseServer();
    if (!sb) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const { session_id, partner_id, country, module_slug } = await req.json();

    if (!session_id || !partner_id) {
      return NextResponse.json(
        { error: "session_id and partner_id are required" },
        { status: 400 }
      );
    }

    // Find the partner config
    const partner = AFFILIATE_PARTNERS.find((p) => p.id === partner_id);
    if (!partner) {
      return NextResponse.json(
        { error: "Unknown partner" },
        { status: 400 }
      );
    }

    // Log the click to affiliate_clicks table
    const { error: clickError } = await sb.from("affiliate_clicks").insert({
      session_id,
      platform: partner_id,
      country: country || null,
      module_slug: module_slug || null,
    });

    if (clickError) {
      console.error("Affiliate click insert error:", clickError);
    }

    // Also log as an analytics event
    await sb.from("analytics_events").insert({
      session_id,
      event_type: "affiliate_click",
      event_data: {
        partner_id,
        partner_name: partner.name,
        category: partner.category,
        module_slug: module_slug || null,
      },
      country: country || null,
      page_path: null,
    });

    // Build the redirect URL with affiliate tracking param
    const redirectUrl = `${partner.affiliateBaseUrl}?${partner.affiliateParam}=inflationclock`;

    return NextResponse.json({ redirect_url: redirectUrl });
  } catch (err) {
    console.error("Affiliate click error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
