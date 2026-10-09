import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";
import { AppIcon } from "@/lib/brand/marks";

export const alt = "SuperMagister: je rooster, huiswerk en cijfers uit Magister, met een walkout.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GOLD = "linear-gradient(160deg, #fff1b8 0%, #f5c84c 38%, #b8862b 100%)";

/** Een gouden kaart zoals in de walkout, schuin in beeld. */
function Card({
  grade,
  label,
  rotate,
  x,
  y,
}: {
  grade: string;
  label: string;
  rotate: number;
  x: number;
  y: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 210,
        height: 296,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "26px 20px",
        borderRadius: 26,
        backgroundImage: GOLD,
        boxShadow: "0 30px 80px rgba(245, 200, 76, 0.35)",
        transform: `rotate(${rotate}deg)`,
        color: "#3b2a07",
      }}
    >
      <div style={{ display: "flex", fontSize: 14, letterSpacing: 3, fontWeight: 700 }}>
        SUPERMAGISTER
      </div>
      <div style={{ display: "flex", fontSize: 104, fontWeight: 800, lineHeight: 1 }}>{grade}</div>
      <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, fontWeight: 700 }}>
        {label}
      </div>
    </div>
  );
}

/** De afbeelding die je ziet als iemand een link naar SuperMagister deelt. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: BRAND.night,
        backgroundImage:
          "radial-gradient(circle at 18% 20%, rgba(155, 123, 255, 0.45) 0%, rgba(7, 8, 22, 0) 45%), radial-gradient(circle at 85% 90%, rgba(70, 240, 200, 0.32) 0%, rgba(7, 8, 22, 0) 50%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 80px",
          width: 720,
        }}
      >
        <AppIcon size={120} />
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 84,
            fontWeight: 800,
            letterSpacing: -2,
          }}
        >
          SuperMagister
        </div>
        <div
          style={{ display: "flex", marginTop: 18, fontSize: 36, color: "rgba(255,255,255,0.78)" }}
        >
          Je rooster, huiswerk en cijfers. Met een walkout.
        </div>
        <div
          style={{ display: "flex", marginTop: 36, fontSize: 22, color: "rgba(255,255,255,0.5)" }}
        >
          supermagister.nl · onofficieel
        </div>
      </div>
      <Card grade="8,1" label="IN FORM" rotate={-9} x={700} y={176} />
      <Card grade="9,7" label="ICON" rotate={7} x={930} y={130} />
    </div>,
    size,
  );
}
