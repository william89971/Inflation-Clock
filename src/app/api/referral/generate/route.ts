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

    const { session_id } = await req.json();

    if (!session_id) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 }
      );
    }

    // Generate referral code: base36 of first 8 chars of session_id
    // Strip dashes from the UUID, take first 8 hex chars, parse as hex, convert to base36
    const hexPart = session_id.replace(/-/g, "").slice(0, 8);
    const referralCode = parseInt(hexPart, 16).toString(36).toUpperCase();

    // Check if this session already has a referral code
    const { data: existing } = await sb
      .from("referrals")
      .select("referral_code")
      .eq("referrer_session_id", session_id)
      .single();

    if (existing) {
      return NextResponse.json({ referral_code: existing.referral_code });
    }

    // Create new referral record
    const { error } = await sb.from("referrals").insert({
      referrer_session_id: session_id,
      referral_code: referralCode,
      status: "active",
    });

    if (error) {
      // Handle unique constraint violation — code might already exist
      if (error.code === "23505") {
        // Append a random suffix to make it unique
        const uniqueCode =
          referralCode + Math.random().toString(36).slice(2, 4).toUpperCase();
        await sb.from("referrals").insert({
          referrer_session_id: session_id,
          referral_code: uniqueCode,
          status: "active",
        });
        return NextResponse.json({ referral_code: uniqueCode });
      }

      console.error("Referral generate error:", error);
      return NextResponse.json(
        { error: "Failed to generate referral code" },
        { status: 500 }
      );
    }

    return NextResponse.json({ referral_code: referralCode });
  } catch (err) {
    console.error("Referral generate error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
