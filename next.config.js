/**
 * `NEXT_BASE_PATH` lets the same build serve from a sub-path of another site
 * (vijeta.me/ClearMind) as well as from its own root. Next prefixes its own
 * routing and asset URLs automatically; plain <a href="/..."> is not touched,
 * so those read the value back through NEXT_PUBLIC_BASE_PATH.
 */
const basePath = process.env.NEXT_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* A self-contained server bundle, so the container needs no node_modules. */
  output: "standalone",
  ...(basePath ? { basePath } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  async headers() {
    return [
      {
        /**
         * The HTML document must never be cached. A statically prerendered page
         * is served with a year-long cache by default, so after a rebuild the
         * browser keeps replaying an old document that references JS chunk
         * files the new build deleted — which surfaces as a client-side
         * exception that an ordinary reload cannot fix.
         *
         * The hashed assets under /_next/static keep their immutable caching;
         * only the document is no-store.
         */
        source: "/",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
