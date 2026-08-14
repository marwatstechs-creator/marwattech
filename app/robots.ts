import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/client",
          "/technical-support",
          "/privacy-policy",
          "/terms-of-service",
          "/refund-policy",
          "/domain-and-hosting-terms",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
