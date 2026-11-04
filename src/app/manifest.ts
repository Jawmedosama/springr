import type { MetadataRoute } from "next";

/** Permet d'installer Springr comme une appli, depuis l'écran d'accueil du téléphone. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Springr",
    short_name: "Springr",
    description: "Jobs, stages et alternance pour les 16 à 35 ans en Belgique.",
    start_url: "/fr/offres",
    display: "standalone",
    background_color: "#0c120e",
    theme_color: "#0b3a26",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
