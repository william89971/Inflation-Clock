import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit: 20 requests per minute per IP
  const ip = getClientIp(req);
  const limited = rateLimit(`insights:${ip}`, { maxRequests: 20, windowMs: 60_000 });
  if (limited) return limited;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ insight: null }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { moduleTopic, country, age, income, language } = body;

  if (typeof moduleTopic !== "string" || !moduleTopic || moduleTopic.length > 500) {
    return NextResponse.json({ error: "Invalid moduleTopic" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const lang = language === "es" ? "Spanish" : "English";
  const safeCountry = typeof country === "string" ? country.slice(0, 100) : "unknown";
  const safeAge = typeof age === "number" ? age : "unknown";
  const safeIncome = typeof income === "string" ? income.slice(0, 100) : "unknown";

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Generate a personalized 2-3 sentence takeaway for a user who just finished reading about "${moduleTopic}" on a Bitcoin education platform.

User context:
- Country: ${safeCountry}
- Age: ${safeAge}
- Monthly income: ${safeIncome}

Make it personal, connecting the topic to their specific situation. Be direct and impactful. Respond in ${lang}. Don't give financial advice — just connect the education to their life.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  return NextResponse.json({ insight: text });
}
