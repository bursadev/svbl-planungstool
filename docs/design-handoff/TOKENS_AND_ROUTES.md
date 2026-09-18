# Handoff: SVBL Planungstool → Next.js + Tailwind

Der Prototyp (`SVBL Planung.dc.html`) ist bewusst inline gestylt – so zeichnet jede Ansicht sofort. Für die Integration in die Next-App wird nicht der Prototyp portiert, sondern seine **Tokens und Screen-Struktur**. Beides ist hier 1:1 abgebildet.

## 1. Tokens → `app/globals.css`

```css
@layer base {
  :root {
    --bg: oklch(0.975 0.004 80);
    --surface: #fff;
    --surface-2: oklch(0.955 0.005 80);
    --line: oklch(0.9 0.006 80);
    --line-strong: oklch(0.85 0.008 80);
    --ink: oklch(0.22 0.012 80);
    --muted: oklch(0.5 0.012 80);
    --accent: oklch(0.45 0.13 250);
    --accent-ink: #fff;
    --accent-soft: oklch(0.93 0.035 250);
    --ok: oklch(0.55 0.13 150);
    --ok-soft: oklch(0.94 0.05 150);
    --warn: oklch(0.68 0.15 75);
    --warn-soft: oklch(0.95 0.06 80);
    --bad: oklch(0.55 0.19 25);
    --bad-soft: oklch(0.94 0.05 25);
    --alt: oklch(0.5 0.12 320);      /* Stellvertretung */
    --alt-soft: oklch(0.94 0.04 320);
  }
  body { @apply bg-bg text-ink font-sans text-sm leading-normal; }
  a { @apply text-accent no-underline hover:underline; }
}
```

## 2. `tailwind.config.ts`

```ts
export default {
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: { DEFAULT: 'var(--surface)', 2: 'var(--surface-2)' },
        line: { DEFAULT: 'var(--line)', strong: 'var(--line-strong)' },
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        accent: { DEFAULT: 'var(--accent)', ink: 'var(--accent-ink)', soft: 'var(--accent-soft)' },
        ok: { DEFAULT: 'var(--ok)', soft: 'var(--ok-soft)' },
        warn: { DEFAULT: 'var(--warn)', soft: 'var(--warn-soft)' },
        bad: { DEFAULT: 'var(--bad)', soft: 'var(--bad-soft)' },
        alt: { DEFAULT: 'var(--alt)', soft: 'var(--alt-soft)' },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: { DEFAULT: '6px', card: '10px' },
      keyframes: {
        modalIn: { from: { opacity: '0', transform: 'translate(-50%,-50%) scale(.97)' }, to: { opacity: '1', transform: 'translate(-50%,-50%) scale(1)' } },
        toastIn: { from: { opacity: '0', transform: 'translateX(-50%) translateY(6px)' }, to: { opacity: '1', transform: 'translateX(-50%) translateY(0)' } },
        fadeUp: { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: { modalIn: 'modalIn .18s cubic-bezier(0.2,0,0,1)', toastIn: 'toastIn .2s ease-out', fadeUp: 'fadeUp .25s ease-out' },
    },
  },
};
```

Merkregel: ein Keyframe darf `transform` nur animieren, wenn es die Zentrierung (`translate(-50%,…)`) mitschreibt – sonst springt das Element.

## 3. Klassen-Rezepte

| Element | Klassen |
|---|---|
| Karte / Panel | `bg-surface border border-line rounded-card` |
| Panel-Kopf | `flex items-center gap-2 px-4 py-3.5 border-b border-line text-sm font-semibold` |
| Tabellenkopf | `grid gap-3 px-4 py-2.5 border-b border-line text-[11px] uppercase tracking-[0.06em] text-muted font-medium` |
| Tabellenzeile | `grid gap-3 px-4 py-2.5 border-b border-line items-center` (klickbar: `text-left w-full hover:bg-surface-2`) |
| Primärbutton | `bg-accent text-accent-ink rounded px-3.5 py-2 font-medium active:scale-[0.96] transition-transform` |
| Sekundärbutton | `border border-line-strong bg-surface rounded px-3.5 py-2 hover:border-accent hover:text-accent` |
| Input / Select | `border border-line-strong rounded px-3 min-h-[38px] bg-surface` – Select zusätzlich `appearance-none pr-[34px] bg-[right_12px_center] bg-no-repeat` mit Chevron-SVG |
| Modal | Overlay `fixed inset-0 bg-black/25 z-20`, Karte `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(440px,100vw-32px)] bg-surface border border-line rounded-card p-5 flex flex-col gap-3.5 shadow-[0_16px_48px_oklch(0_0_0/.16)] animate-modalIn z-[21]` |
| Toast | `fixed bottom-5 left-1/2 -translate-x-1/2 bg-ink text-white rounded-card px-4 py-2.5 text-[13px] animate-toastIn z-30` |
| Statuspunkt | `size-2 rounded-full bg-{ok\|accent\|warn\|bad}` |
| Zahlen | `font-mono tabular-nums` |

Dichte: `--pad` im Prototyp = `py-2.5` (normal) / `py-1.5` (kompakt). Mindesthöhe Bedienelemente 38 px, Hit-Target ≥ 44 px bei Touch.

## 4. Screens → Routen

| Route | Prototyp-Screen | Inhalt |
|---|---|---|
| `/` | Dashboard | Schnellaktionen, Liste «Manuell zu klären» |
| `/planung` | Planungslauf | 4 Stufen: Bedarf → Kurse & Termine → Ausbilder → Übernahme |
| `/zeitplan` | Zeitplan | Wochenraster Standorte × KW (Drag-and-drop), Monatsansicht |
| `/kurse`, `/kurse/typen` | Kurse | Durchführungen, Kurstypen |
| `/ausbilder`, `/ausbilder/[id]` | Ausbilder | Liste; Detail-Tabs Skills & Wissen / Zertifikate / Verfügbarkeit / Einsätze |
| `/lernende`, `/lernende/[id]` | Lernende | Liste (Filter Lehrgang, Jahrgang, Schule); Detail-Tabs Bildungsplan / Kursteilnahmen / Stammdaten |
| `/standorte`, `/standorte/[id]` | Standorte | Liste mit Suche; Detail-Tabs Räume / Geräte / Belegung |
| `/geraete` | Geräte | fest / mobil / Miete, Verschieben, Mietgerät |
| `/import` | Import | 3 Schritte: Quelle → Mapping → Vorschau |
| `/einstellungen` | Einstellungen | Regelparameter, Rollen |
| `/mein-bereich/einsaetze`, `/profil`, `/ferien` | Ausbilder-Rolle | Einsatzkalender (geteilte Komponente), Profil & Zertifikate, Ferien |

Geteilte Komponente: `<Einsatzkalender subject={…} />` – im Prototyp `Einsatzkalender.dc.html`, genutzt von Ausbilder-Detail (Planung) und «Meine Einsätze» (Ausbilder).

## 5. Was serverseitig gehört

Die Prototyp-Logik in `SVBL Planung.dc.html` ist die Referenz für:
- `check(course, instructor)` – harte Regeln (Skills, Zertifikat je Kurstag, Gerätequalifikation, Sprache, Verfügbarkeit) und Soft-Score (Nähe, Präferenz, Kontinuität, Anstellung, Qualifikationspflege) mit Begründungstexten,
- `genDemand(period)` – Bedarf je Jahrgang × Modul × Standort × Schultag-Gruppe,
- `proposeCourses(demand)` – Wochen-, Raum-, Geräte- und Ausbilder-Ledger, Schultag ausgespart,
- `maintenance(instructor)` – Qualifikationspflege (z. B. 5 × IPAF/Jahr),
- `deviceAt(device, kw)` – zeitabhängiger Standort bei mobilen und gemieteten Geräten.

Diese Funktionen sind rein und ohne UI-Bezug – als Service-Layer neben der REST-API übernehmbar, mit Unit-Tests pro Regel (Requirements §11).
