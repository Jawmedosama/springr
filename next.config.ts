import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La copie du Forem créée au build doit suivre la route des offres.
  outputFileTracingIncludes: { "/api/offers": ["./data/forem.json"] },
};

export default nextConfig;
