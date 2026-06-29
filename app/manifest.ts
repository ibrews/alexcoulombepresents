import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alex Coulombe Presents",
    short_name: "ACP",
    description:
      "Unreal Engine, Godot, Apple Vision Pro, AI agents, and a decade of immersive design — plus Manhattan's first Unreal Authorized Training Center.",
    start_url: "/",
    display: "standalone",
    background_color: "#07070f",
    theme_color: "#07070f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
