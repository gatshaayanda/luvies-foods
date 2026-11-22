import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Luvie's Foods",
    short_name: "Luvie's Foods",
    description: "Luvie's Foods menu, ordering, customer account and owner operations.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f5f0",
    theme_color: "#db0b0b",
    orientation: "portrait-primary",
    lang: "en",
    categories: ["business", "productivity"],
    prefer_related_applications: false,
    icons: [{ src: "/luvies-foods-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
    shortcuts: [
      {
        name: "Browse menu",
        short_name: "Menu",
        description: "Browse meals and place an order",
        url: "/",
        icons: [{ src: "/luvies-foods-icon.svg", sizes: "any", type: "image/svg+xml" }]
      },
      {
        name: "My account",
        short_name: "Account",
        description: "Review your food orders",
        url: "/account",
        icons: [{ src: "/luvies-foods-icon.svg", sizes: "any", type: "image/svg+xml" }]
      },
      {
        name: "Owner Briefcase",
        short_name: "Briefcase",
        description: "Manage the Luvie's Foods menu and orders",
        url: "/admin",
        icons: [{ src: "/luvies-foods-icon.svg", sizes: "any", type: "image/svg+xml" }]
      }
    ]
  };
}
