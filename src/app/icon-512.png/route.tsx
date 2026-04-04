import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1d4ed8",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "100px",
        }}
      >
        <span style={{ color: "white", fontSize: 260, fontWeight: 700, letterSpacing: "-10px" }}>
          FD
        </span>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
