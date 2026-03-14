import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fdf6ec 0%, #fde8c8 40%, #f7931a 100%)",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Background grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(247,147,26,0.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Top glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "700px",
            height: "300px",
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(247,147,26,0.35) 0%, transparent 70%)",
          }}
        />

        {/* Bitcoin ₿ symbol */}
        <div
          style={{
            fontSize: "72px",
            marginBottom: "16px",
            filter: "drop-shadow(0 0 24px rgba(247,147,26,0.8))",
          }}
        >
          ₿
        </div>

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(247,147,26,0.15)",
            border: "1px solid rgba(247,147,26,0.5)",
            borderRadius: "999px",
            padding: "6px 20px",
            marginBottom: "24px",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#c05a00",
            }}
          >
            Free · 30 Seconds
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "80px",
            fontWeight: 900,
            color: "#1a0f00",
            letterSpacing: "-2px",
            lineHeight: 1.05,
            textAlign: "center",
            marginBottom: "20px",
            textShadow: "0 2px 8px rgba(247,147,26,0.2)",
          }}
        >
          The Inflation Clock
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "30px",
            fontWeight: 500,
            color: "#7a3f00",
            textAlign: "center",
            maxWidth: "820px",
            lineHeight: 1.4,
          }}
        >
          See exactly how much inflation has cost{" "}
          <span style={{ color: "#f7931a", fontWeight: 800 }}>YOU</span>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #f7931a 0%, #ffb347 50%, #f7931a 100%)",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
