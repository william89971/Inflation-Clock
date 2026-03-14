import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getSupabaseServer } from "@/lib/supabase-server";
import { checkAnthropicBudget, logAnthropicCall } from "@/lib/anthropic-budget";

const BASE_SYSTEM_PROMPT = `You are a Bitcoin and economics tutor for The Inflation Clock education platform. Your job is to explain monetary concepts and Bitcoin in the simplest possible terms.

Rules:
- NEVER use crypto jargon (blockchain, hash rate, decentralized, node, proof of work, DeFi, Web3, etc.) unless the user specifically asks about technical details
- Always use real-world analogies and examples
- If the user provides their country, use examples from that country's economy
- Be encouraging and patient — many users are hearing about these concepts for the first time
- You are NOT a financial advisor. Never tell anyone to buy Bitcoin. Educate them on what it is and let them decide.
- Keep responses concise — 2-3 paragraphs max unless they ask for more
- Respond in whatever language the user writes in (English or Spanish)
- When explaining inflation, connect it to real prices they experience (food, rent, gas)
- You can discuss ALL topics: money, freedom, human rights, energy, environment, housing, politics, war, business, payments, self-custody, etc.
- Tone: Smart, clear, slightly irreverent. Not corporate. Not preachy. Like a brilliant friend explaining something over coffee.
- When comparing Bitcoin to other things, be factual and balanced but don't be afraid to highlight Bitcoin's advantages clearly.
- IMPORTANT: Bitcoin and crypto are NOT the same thing. If asked about crypto, altcoins, or other tokens, clearly explain that Bitcoin is fundamentally different and why.`;

interface UserProfileData {
  country?: string;
  country_code?: string;
  age?: number;
  monthly_income?: number;
  currency?: string;
  lifetime_loss?: number;
  daily_loss?: number;
  monthly_loss?: number;
  monthly_rent?: number;
  monthly_groceries?: number;
  monthly_transport?: number;
  modules_completed?: string[];
  family_members?: { name: string; relationship: string }[];
}

function buildPersonalizedPrompt(
  profile: UserProfileData | null,
  country: string,
  language: string
): string {
  if (!profile || !profile.monthly_income) {
    // No profile data — use simple context like before
    return `${BASE_SYSTEM_PROMPT}\n\nUser context: Country: ${country || "unknown"}, Preferred language: ${language || "en"}`;
  }

  let contextBlock = "";
  const cur = profile.currency || "USD";

  if (profile.country) {
    contextBlock += `The user lives in ${profile.country}.`;
  }
  if (profile.age) {
    contextBlock += ` They are ${profile.age} years old.`;
  }
  if (profile.monthly_income) {
    contextBlock += ` Their monthly income is ${cur} ${profile.monthly_income.toLocaleString()}.`;
  }
  if (profile.lifetime_loss) {
    contextBlock += ` They have lost approximately ${cur} ${Math.round(profile.lifetime_loss).toLocaleString()} to inflation in their lifetime.`;
  }
  if (profile.daily_loss) {
    contextBlock += ` They lose about ${cur} ${profile.daily_loss.toFixed(2)} per day to inflation.`;
  }
  if (profile.monthly_rent) {
    contextBlock += ` Their monthly rent is ${cur} ${profile.monthly_rent.toLocaleString()}.`;
  }
  if (profile.monthly_groceries) {
    contextBlock += ` They spend ${cur} ${profile.monthly_groceries.toLocaleString()}/month on groceries.`;
  }
  if (profile.modules_completed?.length) {
    contextBlock += ` They have completed these education modules: ${profile.modules_completed.join(", ")}.`;
  }
  if (profile.family_members?.length) {
    const familyDesc = profile.family_members
      .map((f) => `${f.name} (${f.relationship})`)
      .join(", ");
    contextBlock += ` Family members: ${familyDesc}.`;
  }

  return `${BASE_SYSTEM_PROMPT}

USER CONTEXT:
${contextBlock}

PERSONALIZATION RULES:
- Use this personal context to make EVERY answer specific to their situation
- When they ask about inflation, reference THEIR numbers: "Based on your income of ${cur} ${profile.monthly_income?.toLocaleString()}, you're losing about ${cur} ${profile.daily_loss?.toFixed(2) || "?"} per day"
- When they ask about Bitcoin savings, use THEIR income to calculate examples
- Reference their country's specific economic situation
- If they've completed modules, don't re-explain those concepts — build on them
- If they have family data, you can reference generational comparisons
- Use examples from their daily life: their rent, their groceries, their local prices
- When they ask "what should I do", guide them to the Get Started module and relevant platforms for their country

User context: Country: ${country || profile.country || "unknown"}, Preferred language: ${language || "en"}`;
}

export async function POST(req: Request) {
  // Rate limit: 10 requests per minute per IP
  const ip = getClientIp(req);
  const limited = rateLimit(`chat:${ip}`, { maxRequests: 10, windowMs: 60_000 });
  if (limited) return limited;

  const budget = await checkAnthropicBudget();
  if (!budget.allowed) {
    return new Response(
      JSON.stringify({ error: "Our AI tutor is taking a rest for today. Browse the modules and check back tomorrow! 📚" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI features are currently unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { messages?: unknown[]; country?: string; language?: string; session_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, country, language, session_id } = body;

  // Validate messages array — limit total count to prevent memory abuse
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages array is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (messages.length > 50) {
    return new Response(JSON.stringify({ error: "Too many messages" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate each message has role and content
  for (const msg of messages.slice(-10)) {
    const m = msg as Record<string, unknown>;
    if (
      typeof m.role !== "string" ||
      !["user", "assistant"].includes(m.role) ||
      typeof m.content !== "string" ||
      m.content.length > 5000
    ) {
      return new Response(JSON.stringify({ error: "Invalid message format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Fetch user profile for personalization (non-blocking — fallback to basic context)
  let profile: UserProfileData | null = null;
  if (session_id && typeof session_id === "string" && session_id.length < 100) {
    try {
      const sb = getSupabaseServer();
      if (sb) {
        const { data } = await sb
          .from("user_profiles")
          .select("country, country_code, age, monthly_income, currency, lifetime_loss, daily_loss, monthly_loss, monthly_rent, monthly_groceries, monthly_transport, modules_completed, family_members")
          .eq("session_id", session_id)
          .single();
        if (data) profile = data;
      }
    } catch {
      // Non-critical — proceed without personalization
    }
  }

  const client = new Anthropic({ apiKey });
  const systemPrompt = buildPersonalizedPrompt(profile, country || "", language || "en");

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: (messages as { role: "user" | "assistant"; content: string }[]).slice(-10),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    },
  });

  logAnthropicCall("/api/chat"); // fire-and-forget

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
