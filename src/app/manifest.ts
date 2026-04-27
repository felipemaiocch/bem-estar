import type { MetadataRoute } from "next";
import { appMeta } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appMeta.name,
    short_name: appMeta.name,
    description:
      "Plataforma de saúde e bem-estar da dr.monitora.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F7FB",
    theme_color: "#0264af",
    icons: [
      {
        src: appMeta.logoPath,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: appMeta.logoPath,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
