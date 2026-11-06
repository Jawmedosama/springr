import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La copie du Forem créée au build doit suivre la route des offres.
  outputFileTracingIncludes: {
    "/api/companies": ["./data/forem.json"],
    "/api/feed": ["./data/forem.json"],
    "/[lang]/jobs/[metier]/[ville]": ["./data/forem.json"],
  },
};

export default nextConfig;
