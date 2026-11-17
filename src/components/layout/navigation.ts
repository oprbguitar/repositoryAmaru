import {
  Archive,
  Beaker,
  BookOpen,
  Bot,
  Boxes,
  BriefcaseBusiness,
  Building2,
  GitBranch,
  GitFork,
  Globe2,
  Home,
  Landmark,
  Newspaper,
  PlaySquare,
  ServerCog,
  Star,
  Workflow,
  Wrench,
} from "lucide-react";
import type { TranslationKey } from "../../i18n/dictionary";

export type NavGroupId = "discover" | "understand" | "build" | "mine" | "admin";

export type NavItem = {
  label: string;
  labelKey: TranslationKey;
  path: string;
  icon: typeof Home;
  group: NavGroupId;
  /** Visible only with an administrator session (local dev counts). */
  adminOnly?: boolean;
};

/**
 * `label` stays as the Spanish fallback so anything reading it without the
 * translator keeps working; `labelKey` is what the shell renders. Items are
 * grouped by what a visitor wants to do, not by how the data is stored.
 */
export const navigation: ReadonlyArray<NavItem> = [
  // Descubrir — what happened, in plain view.
  {
    label: "Hoy",
    labelKey: "nav.today",
    path: "/today",
    icon: Home,
    group: "discover",
  },
  {
    label: "Noticias",
    labelKey: "nav.news",
    path: "/news",
    icon: Newspaper,
    group: "discover",
  },
  {
    label: "Investigación",
    labelKey: "nav.research",
    path: "/research",
    icon: BookOpen,
    group: "discover",
  },
  {
    label: "Videos",
    labelKey: "nav.videos",
    path: "/videos",
    icon: PlaySquare,
    group: "discover",
  },
  // Entender — how the field is shaped.
  {
    label: "Modelos",
    labelKey: "nav.models",
    path: "/models",
    icon: Bot,
    group: "understand",
  },
  {
    label: "Evolución IA",
    labelKey: "nav.evolution",
    path: "/evolution",
    icon: GitBranch,
    group: "understand",
  },
  {
    label: "Mapa",
    labelKey: "nav.map",
    path: "/map",
    icon: Globe2,
    group: "understand",
  },
  {
    label: "Mercado IA",
    labelKey: "nav.markets",
    path: "/markets",
    icon: Landmark,
    group: "understand",
  },
  // Construir — put it to work.
  {
    label: "IA en acción",
    labelKey: "nav.inAction",
    path: "/in-action",
    icon: BriefcaseBusiness,
    group: "build",
  },
  {
    label: "Prompts y agentes",
    labelKey: "nav.prompts",
    path: "/prompts",
    icon: Workflow,
    group: "build",
  },
  {
    label: "Open y local",
    labelKey: "nav.openLocal",
    path: "/open-local",
    icon: Wrench,
    group: "build",
  },
  {
    label: "APIs y proyectos",
    labelKey: "nav.apiCatalog",
    path: "/api-catalog",
    icon: Boxes,
    group: "build",
  },
  {
    label: "GitHub",
    labelKey: "nav.github",
    path: "/github",
    icon: GitFork,
    group: "build",
  },
  // Mi espacio — kept in this browser.
  {
    label: "Mis favoritos",
    labelKey: "nav.favorites",
    path: "/favorites",
    icon: Star,
    group: "mine",
  },
  // Administración — owner tools, hidden from visitors.
  {
    label: "Proveedores",
    labelKey: "nav.providers",
    path: "/providers",
    icon: Building2,
    group: "admin",
    adminOnly: true,
  },
  {
    label: "Laboratorio de APIs",
    labelKey: "nav.developerLab",
    path: "/developer-lab",
    icon: ServerCog,
    group: "admin",
    adminOnly: true,
  },
  {
    label: "Biblioteca local",
    labelKey: "nav.localLibrary",
    path: "/local-library",
    icon: Archive,
    group: "admin",
    adminOnly: true,
  },
  {
    label: "Mi laboratorio",
    labelKey: "nav.laboratory",
    path: "/laboratory",
    icon: Beaker,
    group: "admin",
    adminOnly: true,
  },
];

export const NAV_GROUPS: ReadonlyArray<NavGroupId> = [
  "discover",
  "understand",
  "build",
  "mine",
  "admin",
];

/** Navigation a given visitor may see. */
export function visibleNavigation(isAdmin: boolean): NavItem[] {
  return navigation.filter((item) => isAdmin || !item.adminOnly);
}

export const mobileNavigation = navigation.filter((item) =>
  ["/today", "/models", "/prompts", "/news"].includes(item.path),
);
