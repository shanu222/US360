import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "US360",
    short_name: "US360",
    description: "Remember better. Communicate better. Care better.",
    start_url: "/home",
    display: "standalone",
    background_color: "#fbf7f2",
    theme_color: "#1c2430",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon.svg", sizes: "192x192", type: "image/svg+xml" },
      { src: "/icons/icon.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  };
}
