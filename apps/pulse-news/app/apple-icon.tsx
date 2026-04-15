import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 40,
        background: "linear-gradient(135deg, #7c3aed, #4338ca)",
      }}
    >
      <span
        style={{
          fontSize: 110,
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1,
        }}
      >
        P
      </span>
    </div>,
    { ...size },
  );
}
