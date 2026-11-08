/** @type {import('next').NextConfig} */
const nextConfig = {
  // Put page titles and descriptions in the initial HTML for every visitor and crawler.
  htmlLimitedBots: /.*/,
  // Backend calls (/api/v1, /api/orders, /api/products, /api/categories,
  // /uploads) are forwarded to the Berry API by proxy.ts, which also adds
  // this app's X-App-Key header — a plain rewrite can't set headers.
};

module.exports = nextConfig;
