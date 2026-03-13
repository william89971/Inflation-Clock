import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit: 20 requests per minute per IP
  const ip = getClientIp(req);
  const limited = rateLimit(`eli5:${ip}`, { maxRequests: 20, windowMs: 60_000 });
  if (limited) return limited;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ explanation: null }, { status: 503 });
  }

  let body: { title?: string; content?: string; language?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { title, content, language } = body;

  if (typeof title !== "string" || !title || title.length > 500) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }
  if (typeof content !== "string" || !content || content.length > 5000) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const lang = language === "es" ? "Spanish" : "English";

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Explain this concept as if you're talking to a 5-year-old. Use a fun analogy. Keep it under 3 sentences. Respond in ${lang}.

Topic: ${title}
Content: ${content}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  return NextResponse.json({ explanation: text });
}
