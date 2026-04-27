import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top, rgba(96,165,250,0.9), rgba(37,99,235,1) 55%, rgba(15,23,42,1) 100%)",
          color: "white",
          fontSize: 210,
          fontWeight: 700,
          borderRadius: 120,
        }}
      >
        ♥
      </div>
    ),
    size,
  );
}
