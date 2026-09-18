import path from "node:path";
import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : [],
  },
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
  serverExternalPackages: ["pdfkit", "exceljs"],
  // The PDF export reads font files at runtime; make sure serverless bundles (Netlify/Vercel) include them.
  outputFileTracingIncludes: {
    // pdfkit loads js/standard-fonts/*.cjs and js/data/* with dynamic requires that tracing cannot see.
    "/api/admin/export/pdf": ["./node_modules/@fontsource/ibm-plex-sans-thai/files/*-normal.woff", "./node_modules/pdfkit/js/**/*"],
  },
  poweredByHeader: false,
  // Pin tracing to this project (a lockfile in a parent folder confuses auto-detection).
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
