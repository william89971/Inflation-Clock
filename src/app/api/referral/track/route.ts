import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const sb = getSupabaseServer();
    if (!sb) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const { referral_code, referred_session_id } = await req.json();

    if (!referral_code || !referred_session_id) {
      return NextResponse.json(
        { error: "referral_code and referred_session_id are required" },
        { status: 400 }
      );
    }

    // Look up the referral record
    const { data: referral, error: lookupError } = await sb
      .from("referrals")
      .select("*")
      .eq("referral_code", referral_code)
      .eq("status", "active")
      .single();

    if (lookupError || !referral) {
      return NextResponse.json(
        { error: "Invalid or expired referral code" },
        { status: 404 }
      );
    }

    // Don't allow self-referrals
    if (referral.referrer_session_id === referred_session_id) {
      return NextResponse.json(
        { error: "Cannot use your own referral code" },
        { status: 400 }
      );
    }

    // Update the referral record with the referred session
    const { error: updateError } = await sb
      .from("referrals")
      .update({
        referred_session_id: referred_session_id,
        status: "converted",
        converted_at: new Date().toISOString(),
      })
      .eq("id", referral.id);

    if (updateError) {
      console.error("Referral track update error:", updateError);
      return NextResponse.json(
        { error: "Failed to track referral" },
        { status: 500 }
      );
    }

    // Log analytics event
    await sb.from("analytics_events").insert({
      session_id: referred_session_id,
      event_type: "referral_signup",
      event_data: {
        referral_code,
        referrer_session_id: referral.referrer_session_id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Referral track error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
