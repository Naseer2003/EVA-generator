import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with a self-contained server.js and only the
  // node_modules the app actually traces. Lets the runtime image skip
  // `npm install` entirely. `public` and `.next/static` are not copied in
  // automatically — the Dockerfile copies them alongside server.js.
  output: "standalone",
};

export default nextConfig;
