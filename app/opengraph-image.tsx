import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Marwat Tech";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d1321",
          fontFamily: "sans-serif",
          padding: 60,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              backgroundColor: "#c81e2e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 48,
              fontWeight: 900,
            }}
          >
            M
          </div>
          <div style={{ color: "white", fontSize: 56, fontWeight: 800 }}>
            Marwat<span style={{ color: "#c81e2e" }}>Tech</span>
          </div>
        </div>
        <div
          style={{
            color: "#e2e8f0",
            fontSize: 34,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          Web Development · Ecommerce · Mobile Apps · SEO · AI Solutions
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
