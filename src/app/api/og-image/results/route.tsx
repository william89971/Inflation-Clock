import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸",
  SV: "🇸🇻",
  MX: "🇲🇽",
  AR: "🇦🇷",
  BR: "🇧🇷",
  CO: "🇨🇴",
  VE: "🇻🇪",
};

function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const country = searchParams.get("country") || "US";
  const lifetimeLoss = parseFloat(searchParams.get("lifetimeLoss") || "0");
  const dailyLoss = parseFloat(searchParams.get("dailyLoss") || "0");
  const age = searchParams.get("age") || "30";
  const isStory = searchParams.get("story") === "true";

  const width = isStory ? 1080 : 1200;
  const height = isStory ? 1920 : 630;
  const flag = COUNTRY_FLAGS[country] || "🌍";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: isStory ? "center" : "flex-start",
          backgroundColor: "#111111",
          padding: isStory ? "80px 60px" : "50px 60px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: isStory ? "80px" : "30px",
          }}
        >
          <div
            style={{
              fontSize: isStory ? "24px" : "18px",
              fontWeight: 800,
              color: "#dc2626",
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}
          >
            The Inflation Clock
          </div>
        </div>

        {/* Flag */}
        <div
          style={{
            fontSize: isStory ? "96px" : "64px",
            marginBottom: isStory ? "40px" : "20px",
          }}
        >
          {flag}
        </div>

        {/* Lifetime Loss */}
        <div
          style={{
            fontSize: isStory ? "96px" : "72px",
            fontWeight: 900,
            color: "#dc2626",
            lineHeight: 1,
            marginBottom: isStory ? "24px" : "12px",
            textShadow: "0 0 40px rgba(220, 38, 38, 0.4)",
          }}
        >
          -${formatNumber(lifetimeLoss)}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: isStory ? "32px" : "24px",
            color: "#a3a3a3",
            marginBottom: isStory ? "60px" : "24px",
            textAlign: "center",
          }}
        >
          Lost to inflation since birth (age {age})
        </div>

        {/* Daily Loss */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: isStory ? "24px 48px" : "16px 32px",
            borderRadius: "16px",
            border: "1px solid #2a2a2a",
            backgroundColor: "#1e1e1e",
            marginBottom: isStory ? "80px" : "auto",
          }}
        >
          <div
            style={{
              fontSize: isStory ? "24px" : "18px",
              color: "#737373",
            }}
          >
            Losing
          </div>
          <div
            style={{
              fontSize: isStory ? "32px" : "24px",
              fontWeight: 700,
              color: "#ef4444",
            }}
          >
            ${dailyLoss.toFixed(2)}/day
          </div>
          <div
            style={{
              fontSize: isStory ? "24px" : "18px",
              color: "#737373",
            }}
          >
            right now
          </div>
        </div>

        {/* Watermark */}
        <div
          style={{
            fontSize: isStory ? "22px" : "16px",
            color: "#737373",
            marginTop: isStory ? "auto" : "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>See yours at</span>
          <span style={{ color: "#f7931a", fontWeight: 700 }}>
            inflationclock.com
          </span>
        </div>
      </div>
    ),
    {
      width,
      height,
    }
  );
}
