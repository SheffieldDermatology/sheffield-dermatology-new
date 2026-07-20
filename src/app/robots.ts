import type { MetadataRoute } from "next";

const ORIGIN = process.env.APP_ORIGIN ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Authenticated and transactional areas must not be indexed.
        disallow: ["/patient", "/staff", "/admin", "/api", "/book/confirm"],
      },
    ],
    sitemap: `${ORIGIN}/sitemap.xml`,
  };
}
