import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") || "Bitcoin Education";
  const hook = searchParams.get("hook") || "Learn the truth about money.";
  const icon = searchParams.get("icon") || "📚";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: "#111111",
          padding: "60px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #f7931a, #c27614)",
          }}
        />

        {/* Branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "#f7931a",
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}
          >
            The Inflation Clock
          </div>
          <div
            style={{
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              backgroundColor: "#737373",
            }}
          />
          <div
            style={{
              fontSize: "16px",
              color: "#737373",
              fontWeight: 500,
            }}
          >
            Education
          </div>
        </div>

        {/* Icon */}
        <div
          style={{
            fontSize: "72px",
            marginBottom: "24px",
          }}
        >
          {icon}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: 900,
            color: "#f5f5f5",
            lineHeight: 1.1,
            marginBottom: "20px",
            maxWidth: "900px",
          }}
        >
          {title}
        </div>

        {/* Hook */}
        <div
          style={{
            fontSize: "28px",
            color: "#a3a3a3",
            lineHeight: 1.4,
            maxWidth: "800px",
          }}
        >
          {hook}
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "80px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              color: "#737373",
            }}
          >
            inflationclock.com/learn
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
