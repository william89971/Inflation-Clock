import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `You are a Bitcoin and economics tutor for The Inflation Clock education platform. Your job is to explain monetary concepts and Bitcoin in the simplest possible terms.

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

export async function POST(req: Request) {
  // Rate limit: 10 requests per minute per IP
  const ip = getClientIp(req);
  const limited = rateLimit(`chat:${ip}`, { maxRequests: 10, windowMs: 60_000 });
  if (limited) return limited;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI features are currently unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { messages?: unknown[]; country?: string; language?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, country, language } = body;

  // Validate messages array
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages array is required" }), {
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

  const client = new Anthropic({ apiKey });

  const systemWithContext = `${SYSTEM_PROMPT}\n\nUser context: Country: ${country || "unknown"}, Preferred language: ${language || "en"}`;

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemWithContext,
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

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
