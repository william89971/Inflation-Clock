import { CountryCode, COUNTRIES } from "@/data/inflation";

// ── Types ────────────────────────────────────────────────────────────
export interface UserProfile {
  id?: string;
  session_id: string;
  country?: string;
  country_code?: CountryCode;
  region?: string;
  city?: string;
  birth_year?: number;
  age?: number;
  monthly_income?: number;
  currency?: string;
  language?: string;
  monthly_rent?: number;
  monthly_groceries?: number;
  monthly_transport?: number;
  monthly_utilities?: number;
  monthly_healthcare?: number;
  monthly_education?: number;
  monthly_other?: number;
  expenses_updated_at?: string;
  family_members?: FamilyMember[];
  lifetime_loss?: number;
  daily_loss?: number;
  monthly_loss?: number;
  yearly_loss?: number;
  btc_comparison?: number;
  last_inflation_rate?: number;
  modules_completed?: string[];
  last_visit?: string;
  visit_count?: number;
  total_chat_messages?: number;
  referral_code?: string;
  alerts_enabled?: boolean;
  alert_email?: string;
  alert_frequency?: string;
  last_alert_sent?: string;
  device_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FamilyMember {
  name: string;
  birth_year: number;
  relationship: "parent" | "grandparent" | "sibling" | "child" | "partner";
  country?: CountryCode;
  monthly_income?: number;
}

export interface ExpenseData {
  monthly_rent: number;
  monthly_groceries: number;
  monthly_transport: number;
  monthly_utilities: number;
  monthly_healthcare: number;
  monthly_education: number;
  monthly_other: number;
}

// ── Session ID (shared pattern) ──────────────────────────────────────
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("session_id", id);
  }
  return id;
}

// ── localStorage profile cache ───────────────────────────────────────
const PROFILE_KEY = "user_profile";

export function getCachedProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCachedProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// ── Client-side profile API calls ────────────────────────────────────
export async function fetchProfile(): Promise<UserProfile | null> {
  const sessionId = getSessionId();
  if (!sessionId) return null;

  try {
    // Use POST with session_id in body to avoid leaking it in URL/logs/referer headers
    const res = await fetch("/api/user/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, _action: "fetch" }),
    });
    if (!res.ok) return getCachedProfile();
    const data = await res.json();
    if (data.profile) {
      setCachedProfile(data.profile);
      return data.profile;
    }
    return getCachedProfile();
  } catch {
    return getCachedProfile();
  }
}

export async function saveProfile(
  data: Partial<UserProfile>
): Promise<UserProfile | null> {
  const sessionId = getSessionId();
  if (!sessionId) return null;

  // Resolve currency from country_code if not provided
  if (data.country_code && !data.currency) {
    const config = COUNTRIES[data.country_code as CountryCode];
    if (config) data.currency = config.currency;
  }

  try {
    const res = await fetch("/api/user/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, ...data }),
    });
    if (!res.ok) {
      // Fallback: merge into cached profile
      const cached = getCachedProfile() || { session_id: sessionId };
      const merged = { ...cached, ...data, updated_at: new Date().toISOString() };
      setCachedProfile(merged as UserProfile);
      return merged as UserProfile;
    }
    const result = await res.json();
    if (result.profile) {
      setCachedProfile(result.profile);
      return result.profile;
    }
    return null;
  } catch {
    const cached = getCachedProfile() || { session_id: sessionId };
    const merged = { ...cached, ...data, updated_at: new Date().toISOString() };
    setCachedProfile(merged as UserProfile);
    return merged as UserProfile;
  }
}

export async function saveExpenses(expenses: ExpenseData): Promise<void> {
  const sessionId = getSessionId();
  if (!sessionId) return;

  try {
    await fetch("/api/user/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        ...expenses,
        expenses_updated_at: new Date().toISOString(),
      }),
    });

    // Update cached profile
    const cached = getCachedProfile();
    if (cached) {
      setCachedProfile({
        ...cached,
        ...expenses,
        expenses_updated_at: new Date().toISOString(),
      });
    }
  } catch {
    // Silently fail — save locally at minimum
    const cached = getCachedProfile() || { session_id: sessionId };
    setCachedProfile({
      ...cached,
      ...expenses,
      expenses_updated_at: new Date().toISOString(),
    } as UserProfile);
  }
}

// ── Helper: check if user has enough data for dashboard ──────────────
export function hasProfileData(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return !!(profile.country_code && profile.monthly_income && profile.birth_year);
}
