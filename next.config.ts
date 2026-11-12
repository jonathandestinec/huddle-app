import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Almost every Huddle page depends on the signed-in viewer, so we render dynamically
  // instead of opting into Cache Components / partial prerendering.
  cacheComponents: false,
  // Email rendering needs react-dom/server, which the server-action (react-server) bundle excludes.
  // Loading these from node_modules at runtime makes emails work from server actions too.
  serverExternalPackages: ["@react-email/components", "@react-email/render", "resend"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
