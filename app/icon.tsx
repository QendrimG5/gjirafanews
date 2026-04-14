import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: "#18181b",
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#22c55e",
            lineHeight: 1,
          }}
        >
          G
        </span>
      </div>
    ),
    { ...size }
  );
}
