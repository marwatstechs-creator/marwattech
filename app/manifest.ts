import type { MetadataRoute } from "next";

import { SITE } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} | Web Development, Ecommerce, SEO & AI Solutions`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#faf9fd",
    theme_color: "#7464c6",
    lang: "en",
    categories: ["business", "technology", "web"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
