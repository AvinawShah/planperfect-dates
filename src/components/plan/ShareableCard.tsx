import { forwardRef } from "react";
import type { Plan } from "@/lib/api";

interface Props {
  plan: Plan;
}

/**
 * Off-screen, fixed-width (1080px) "story-card" used purely for image export.
 * Uses inline styles + hex colors so html-to-image renders it identically
 * regardless of the app's theme tokens.
 */
const ShareableCard = forwardRef<HTMLDivElement, Props>(({ plan }, ref) => {
  const markerGradients = [
    "linear-gradient(135deg, #fb7185, #ec4899)",
    "linear-gradient(135deg, #fcd34d, #f97316)",
    "linear-gradient(135deg, #e879f9, #8b5cf6)",
    "linear-gradient(135deg, #38bdf8, #6366f1)",
    "linear-gradient(135deg, #34d399, #14b8a6)",
    "linear-gradient(135deg, #fde047, #fb7185)",
  ];

  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        background: "linear-gradient(135deg, #fff1f2 0%, #fce7f3 40%, #ede9fe 100%)",
        padding: 56,
        color: "#1f1033",
      }}
    >
      <div
        style={{
          borderRadius: 36,
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: "0 30px 80px -20px rgba(236, 72, 153, 0.35)",
          border: "1px solid rgba(236, 72, 153, 0.15)",
        }}
      >
        {/* Header */}
        <div
          style={{
            position: "relative",
            padding: "56px 56px 48px",
            background:
              "linear-gradient(120deg, #ff6b9d 0%, #c084fc 45%, #60a5fa 100%)",
            color: "#ffffff",
          }}
        >
          <div style={{ position: "absolute", top: 24, right: 36, fontSize: 44 }}>✨</div>
          <div style={{ position: "absolute", bottom: 18, left: 40, fontSize: 36 }}>💖</div>
          <div style={{ position: "absolute", top: 40, left: "55%", fontSize: 28 }}>🌟</div>

          <div
            style={{
              fontSize: 14,
              letterSpacing: 4,
              textTransform: "uppercase",
              fontWeight: 700,
              opacity: 0.95,
            }}
          >
            💌 Your AI date plan
          </div>
          <div
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 64,
              lineHeight: 1.05,
              fontWeight: 700,
              marginTop: 12,
              textShadow: "0 2px 12px rgba(0,0,0,0.15)",
            }}
          >
            {plan.title}
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 22,
              opacity: 0.95,
              textTransform: "capitalize",
            }}
          >
            💝 {plan.mood} &nbsp;·&nbsp; 📍 {plan.location} &nbsp;·&nbsp; 💸 {plan.currency}
            {plan.totalCost} of {plan.currency}{plan.budget}
          </div>
        </div>

        {/* Itinerary */}
        <div style={{ padding: "44px 56px 48px" }}>
          {plan.itinerary.map((item, i) => (
            <div
              key={`${item.time}-${i}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 24,
                padding: "22px 0",
                borderTop: i === 0 ? "none" : "1px solid #f5e1ec",
              }}
            >
              <div
                style={{
                  flex: "0 0 auto",
                  width: 76,
                  height: 76,
                  borderRadius: "50%",
                  background: markerGradients[i % markerGradients.length],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  color: "#ffffff",
                  boxShadow: "0 10px 24px -8px rgba(236,72,153,0.45)",
                }}
              >
                {item.emoji ?? "📍"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    color: "#ec4899",
                    fontWeight: 700,
                  }}
                >
                  ⏰ {item.time}
                </div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 32,
                    lineHeight: 1.2,
                    marginTop: 4,
                    color: "#1f1033",
                  }}
                >
                  {item.activity}
                </div>
                <div style={{ fontSize: 18, color: "#6b5876", marginTop: 4 }}>
                  📍 {item.place}
                </div>
              </div>
              <div style={{ textAlign: "right", flex: "0 0 auto" }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#ec4899" }}>
                  {plan.currency}
                  {item.cost}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "#9a8aaa",
                  }}
                >
                  est.
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "24px 56px 32px",
            background: "linear-gradient(90deg, #fdf2f8, #faf5ff)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            color: "#6b5876",
          }}
        >
          <span>🌸 Crafted with DateCraft</span>
          <span style={{ fontWeight: 700, color: "#ec4899" }}>
            Total {plan.currency}
            {plan.totalCost} 💕
          </span>
        </div>
      </div>
    </div>
  );
});

ShareableCard.displayName = "ShareableCard";
export default ShareableCard;
