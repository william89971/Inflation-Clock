import { getSupabaseServer } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = getSupabaseServer();
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  await sb?.from("api_usage").delete().lt("created_at", cutoff);

  return Response.json({ ok: true });
}
