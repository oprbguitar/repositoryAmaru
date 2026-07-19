import {
  Archive,
  Beaker,
  BookOpen,
  Bot,
  Building2,
  GitFork,
  Globe2,
  Home,
  Landmark,
  Newspaper,
  PlaySquare,
  ServerCog,
  Wrench,
} from "lucide-react";

export const navigation = [
  { label: "Hoy", path: "/today", icon: Home },
  { label: "Proveedores", path: "/providers", icon: Building2 },
  { label: "Modelos", path: "/models", icon: Bot },
  { label: "Laboratorio de APIs", path: "/developer-lab", icon: ServerCog },
  { label: "Open y local", path: "/open-local", icon: Wrench },
  { label: "Noticias", path: "/news", icon: Newspaper },
  { label: "Investigación", path: "/research", icon: BookOpen },
  { label: "GitHub", path: "/github", icon: GitFork },
  { label: "Videos", path: "/videos", icon: PlaySquare },
  { label: "Mapa", path: "/map", icon: Globe2 },
  { label: "Mercado IA", path: "/markets", icon: Landmark },
  { label: "Biblioteca local", path: "/local-library", icon: Archive },
  { label: "Mi laboratorio", path: "/laboratory", icon: Beaker },
] as const;

export const mobileNavigation = navigation.filter((item) =>
  ["/today", "/providers", "/developer-lab", "/laboratory"].includes(item.path),
);
