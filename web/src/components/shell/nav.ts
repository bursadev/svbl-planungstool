import type { UserRole } from "@/lib/roles";

export type NavItem = { label: string; href: string };
export type NavGroup = { title: string; items: NavItem[] };

const PLANNING_NAV: NavGroup[] = [
  {
    title: "Planung",
    items: [
      { label: "Dashboard", href: "/" },
      { label: "Planungslauf", href: "/planung" },
      { label: "Zeitplan", href: "/zeitplan" },
    ],
  },
  {
    title: "Stammdaten",
    items: [
      { label: "Kurse", href: "/kurse" },
      { label: "Ausbilder", href: "/ausbilder" },
      { label: "Lernende", href: "/lernende" },
      { label: "Berufsschulen", href: "/berufsschulen" },
      { label: "Standorte", href: "/standorte" },
      { label: "Geräte", href: "/geraete" },
      { label: "Kataloge", href: "/kataloge" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Import", href: "/import" },
      { label: "Einstellungen", href: "/einstellungen" },
    ],
  },
];

const INSTRUCTOR_NAV: NavGroup[] = [
  {
    title: "Mein Bereich",
    items: [
      { label: "Meine Einsätze", href: "/mein-bereich/einsaetze" },
      { label: "Profil & Zertifikate", href: "/mein-bereich/profil" },
      { label: "Ferien", href: "/mein-bereich/ferien" },
    ],
  },
];

/** Instructors get their own area; every other role sees the planning navigation. */
export function navForRole(role: UserRole | undefined): NavGroup[] {
  return role === "instructor" ? INSTRUCTOR_NAV : PLANNING_NAV;
}

/** An item is active on its own route and on sub-routes; the dashboard only on `/` itself. */
export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
