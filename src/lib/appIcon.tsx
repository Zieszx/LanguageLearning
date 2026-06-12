import { ImageResponse } from "next/og";

/** Renders the Cakap PWA icon (chat bubble + three dots) at a given size. */
export function renderAppIcon(size: number) {
  const dot = size * 0.094;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#4F46E5",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: size * 0.055,
            width: size * 0.62,
            height: size * 0.42,
            background: "#FFFFFF",
            borderRadius: size * 0.16,
          }}
        >
          <div style={{ width: dot, height: dot, borderRadius: "50%", background: "#4F46E5" }} />
          <div style={{ width: dot, height: dot, borderRadius: "50%", background: "#22C55E" }} />
          <div style={{ width: dot, height: dot, borderRadius: "50%", background: "#4F46E5" }} />
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
