import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Love is Foods",
    short_name: "Love is Foods",
    description: "Love is Foods menu, ordering, customer account and owner operations.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f5f0",
    theme_color: "#db0b0b",
    orientation: "portrait-primary",
    lang: "en",
    categories: ["business", "productivity"],
    prefer_related_applications: false,
    icons: [
      { src: "/love-is-foods-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/love-is-foods-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/love-is-foods-icon-192.png", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/love-is-foods-icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      
      { src: "/love-is-foods-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ],
    shortcuts: [
      {
        name: "Browse menu",
        short_name: "Menu",
        description: "Browse meals and place an order",
        url: "/",
        icons: [{ src: "/love-is-foods-icon.svg", sizes: "any", type: "image/svg+xml" }]
      },
      {
        name: "My account",
        short_name: "Account",
        description: "Review your food orders",
        url: "/account",
        icons: [{ src: "/love-is-foods-icon.svg", sizes: "any", type: "image/svg+xml" }]
      },
      {
        name: "Owner Briefcase",
        short_name: "Briefcase",
        description: "Manage the Love is Foods menu and orders",
        url: "/admin",
        icons: [{ src: "/love-is-foods-icon.svg", sizes: "any", type: "image/svg+xml" }]
      }
    ]
  };
}
