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
import type { TranslationKey } from "../../i18n/dictionary";

/**
 * `label` stays as the Spanish fallback so anything reading it without the
 * translator keeps working; `labelKey` is what the shell renders.
 */
export const navigation = [
  { label: "Hoy", labelKey: "nav.today", path: "/today", icon: Home },
  {
    label: "Proveedores",
    labelKey: "nav.providers",
    path: "/providers",
    icon: Building2,
  },
  { label: "Modelos", labelKey: "nav.models", path: "/models", icon: Bot },
  {
    label: "Laboratorio de APIs",
    labelKey: "nav.developerLab",
    path: "/developer-lab",
    icon: ServerCog,
  },
  {
    label: "Open y local",
    labelKey: "nav.openLocal",
    path: "/open-local",
    icon: Wrench,
  },
  { label: "Noticias", labelKey: "nav.news", path: "/news", icon: Newspaper },
  {
    label: "Investigación",
    labelKey: "nav.research",
    path: "/research",
    icon: BookOpen,
  },
  { label: "GitHub", labelKey: "nav.github", path: "/github", icon: GitFork },
  {
    label: "Videos",
    labelKey: "nav.videos",
    path: "/videos",
    icon: PlaySquare,
  },
  { label: "Mapa", labelKey: "nav.map", path: "/map", icon: Globe2 },
  {
    label: "Mercado IA",
    labelKey: "nav.markets",
    path: "/markets",
    icon: Landmark,
  },
  {
    label: "Biblioteca local",
    labelKey: "nav.localLibrary",
    path: "/local-library",
    icon: Archive,
  },
  {
    label: "Mi laboratorio",
    labelKey: "nav.laboratory",
    path: "/laboratory",
    icon: Beaker,
  },
] as const satisfies ReadonlyArray<{
  label: string;
  labelKey: TranslationKey;
  path: string;
  icon: typeof Home;
}>;

export const mobileNavigation = navigation.filter((item) =>
  ["/today", "/providers", "/developer-lab", "/laboratory"].includes(item.path),
);
