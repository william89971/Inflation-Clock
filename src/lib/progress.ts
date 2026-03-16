import { getSupabase } from "./supabase";
import { getSessionId } from "./profile";

interface ProgressEntry {
  moduleSlug: string;
  sectionIndex: number;
  completed: boolean;
}

// localStorage fallback
function getLocalProgress(): ProgressEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("learn_progress");
  return raw ? JSON.parse(raw) : [];
}

function setLocalProgress(entries: ProgressEntry[]) {
  localStorage.setItem("learn_progress", JSON.stringify(entries));
}

export async function markSectionComplete(
  moduleSlug: string,
  sectionIndex: number,
  country?: string
): Promise<void> {
  const sb = getSupabase();
  const sessionId = getSessionId();

  if (sb) {
    await sb.from("user_progress").upsert(
      {
        session_id: sessionId,
        module_slug: moduleSlug,
        section_index: sectionIndex,
        completed: true,
        country,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id,module_slug,section_index" }
    );
  }

  // Always update localStorage as fallback
  const local = getLocalProgress();
  const existing = local.find(
    (e) => e.moduleSlug === moduleSlug && e.sectionIndex === sectionIndex
  );
  if (existing) {
    existing.completed = true;
  } else {
    local.push({ moduleSlug, sectionIndex, completed: true });
  }
  setLocalProgress(local);
}

export async function getModuleProgress(
  moduleSlug: string,
  totalSections: number
): Promise<{ completed: number; total: number; percentage: number }> {
  const sb = getSupabase();
  const sessionId = getSessionId();

  let completedCount = 0;

  if (sb) {
    const { data } = await sb
      .from("user_progress")
      .select("section_index")
      .eq("session_id", sessionId)
      .eq("module_slug", moduleSlug)
      .eq("completed", true);
    completedCount = data?.length ?? 0;
  } else {
    const local = getLocalProgress();
    completedCount = local.filter(
      (e) => e.moduleSlug === moduleSlug && e.completed
    ).length;
  }

  return {
    completed: completedCount,
    total: totalSections,
    percentage: totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0,
  };
}

export async function getAllProgress(): Promise<
  Record<string, { completed: number }>
> {
  const sb = getSupabase();
  const sessionId = getSessionId();
  const result: Record<string, { completed: number }> = {};

  if (sb) {
    const { data } = await sb
      .from("user_progress")
      .select("module_slug, section_index")
      .eq("session_id", sessionId)
      .eq("completed", true);

    if (data) {
      for (const row of data) {
        if (!result[row.module_slug]) result[row.module_slug] = { completed: 0 };
        result[row.module_slug].completed++;
      }
    }
  } else {
    const local = getLocalProgress();
    for (const entry of local) {
      if (!entry.completed) continue;
      if (!result[entry.moduleSlug]) result[entry.moduleSlug] = { completed: 0 };
      result[entry.moduleSlug].completed++;
    }
  }

  return result;
}

export async function trackAffiliateClick(
  platform: string,
  country?: string,
  moduleSlug?: string
): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("affiliate_clicks").insert({
    session_id: getSessionId(),
    platform,
    country,
    module_slug: moduleSlug,
  });
}
