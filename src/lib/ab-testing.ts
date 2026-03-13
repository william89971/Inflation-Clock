import { getSupabase } from "@/lib/supabase";

/**
 * Simple hash function for deterministic variant assignment.
 * Converts a string into a numeric hash.
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get variant for a test based on session ID hash.
 * Deterministically assigns a variant so the same user always sees
 * the same variant for a given test.
 */
export function getVariant(
  testName: string,
  variants: string[],
  sessionId: string
): string {
  if (variants.length === 0) {
    throw new Error("At least one variant is required");
  }

  const hash = simpleHash(`${testName}:${sessionId}`);
  const index = hash % variants.length;
  return variants[index];
}

/**
 * Track variant assignment in Supabase ab_tests table.
 */
export async function trackVariant(
  testName: string,
  variant: string,
  sessionId: string
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from("ab_tests").upsert(
      {
        test_name: testName,
        variant,
        session_id: sessionId,
        assigned_at: new Date().toISOString(),
      },
      { onConflict: "test_name,session_id" }
    );
  } catch {
    // Silently fail — A/B testing should never break the app
  }
}

/**
 * Track conversion for a variant in the ab_tests table.
 * Updates converted=true for the matching test/session combination.
 */
export async function trackConversion(
  testName: string,
  sessionId: string
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase
      .from("ab_tests")
      .update({
        converted: true,
        converted_at: new Date().toISOString(),
      })
      .eq("test_name", testName)
      .eq("session_id", sessionId);
  } catch {
    // Silently fail — A/B testing should never break the app
  }
}
