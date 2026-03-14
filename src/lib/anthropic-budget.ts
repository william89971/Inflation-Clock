import { getSupabaseServer } from "@/lib/supabase-server";

const MAX_CALLS_PER_DAY = 1000;

export async function checkAnthropicBudget(): Promise<{ allowed: boolean }> {
  const sb = getSupabaseServer();
  if (!sb) return { allowed: true }; // fail open if DB unavailable

  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const { count } = await sb
    .from("api_usage")
    .select("*", { count: "exact", head: true })
    .eq("api_name", "anthropic")
    .gte("created_at", `${today}T00:00:00Z`);

  return { allowed: (count ?? 0) < MAX_CALLS_PER_DAY };
}

export async function logAnthropicCall(endpoint: string): Promise<void> {
  const sb = getSupabaseServer();
  if (!sb) return;
  await sb.from("api_usage").insert({ api_name: "anthropic", endpoint });
}
