/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
