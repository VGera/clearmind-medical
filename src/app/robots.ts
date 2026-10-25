import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL;

export default function robots(): MetadataRoute.Robots {
  /* Until a real domain is configured this is a prototype on a LAN; nothing
     here should be crawled. */
  if (!SITE) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
