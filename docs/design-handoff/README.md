# Handoff: SVBL Kursplanungstool (PoC)

## Overview

Internes Planungstool für das Kursgeschäft der **ASFL SVBL** (Swiss Logistics). Die Planung disponiert überbetriebliche Kurse (ÜK) für Lernende sowie Erwachsenenkurse über 11 Ausbildungszentren, ~210 Ausbilder (ca. 70 angestellt, 140 Freelancer) und Geräte (Stapler, Hebebühnen). Kern sind drei Dinge:

1. **Planungslauf** pro Semester: Bedarf → Kurse & Termine → Ausbilder → Übernahme, jede Stufe mit Vorschlägen der Engine.
2. **Regelbasierte Matching-Engine**: harte Regeln blockieren, weiche Regeln bewerten; jede Entscheidung trägt eine lesbare Begründung.
3. **Assistent**: beantwortet Planungsfragen mit strukturierten Karten und ausführbaren Aktionen (kein Freitext-Zugriff auf Rohdaten).

Sprache der Oberfläche: **Deutsch (Schweizer Schreibweise, «ss» statt «ß», Anführungszeichen «…»)**. Kalender: Montag zuerst, ISO-Wochen.

## About the Design Files

Die Dateien unter `reference/` sind **Design-Referenzen in HTML** – ein lauffähiger Prototyp, der Aussehen und Verhalten zeigt, **kein Produktionscode zum Kopieren**. `SVBL Planung.dc.html` öffnet man direkt im Browser; `support.js` ist nur die Laufzeit des Prototyp-Formats und wird **nicht** übernommen. Aufgabe: diese Screens in **Next.js (App Router) + Tailwind + TypeScript** neu bauen, mit den Mustern des Zielprojekts.

Die **Geschäftslogik im Prototyp ist die verbindliche Spezifikation** (Abschnitt „Engine" unten). Sie steckt in der Logikklasse am Ende von `reference/SVBL Planung.dc.html` (`class Component extends DCLogic`) – reine Funktionen ohne UI-Bezug, direkt in einen Service-Layer übernehmbar.

`domain/` enthält die Originalunterlagen des Kunden: Requirements (mit `#must` / `#should` / `#nice` / `#question`), Datenmodell (Entities inkl. ER-Diagrammen und Constraint-Tabelle), Interviewprotokoll (Primärquelle der Regeln), Roadmap, offene Fragen, Kundenprofil. `TOKENS_AND_ROUTES.md` enthält Tokens, `tailwind.config`-Mapping, Klassen-Rezepte und das Screen-zu-Route-Mapping.

## Fidelity

**High-fidelity** für Layout, Farben, Typografie, Abstände, Zustände und Interaktionen – pixelnah nachbauen, aber mit den Komponenten des Zielprojekts. Die **Daten sind Demo-Daten** (prominente Personen als Platzhalter: Roger Federer, Marie Curie …) und müssen durch echte Quellen ersetzt werden (Schul-CSV, Planungs-Excel).

## Design Tokens

Vollständige Definition mit `tailwind.config`-Mapping: **`TOKENS_AND_ROUTES.md`**. Kurzfassung:

| Token | Wert | Verwendung |
|---|---|---|
| `--bg` | `oklch(0.975 0.004 80)` | App-Hintergrund |
| `--surface` | `#fff` | Karten, Tabellen, Panels |
| `--surface-2` | `oklch(0.955 0.005 80)` | Zebra, Hover, Code-Chips |
| `--line` | `oklch(0.9 0.006 80)` | Trennlinien, Kartenrahmen |
| `--line-strong` | `oklch(0.85 0.008 80)` | Formularrahmen |
| `--ink` | `oklch(0.22 0.012 80)` | Text |
| `--muted` | `oklch(0.5 0.012 80)` | Sekundärtext, Labels |
| `--accent` | `oklch(0.45 0.13 250)` | Primäraktion, «geplant» |
| `--accent-soft` | `oklch(0.93 0.035 250)` | aktive Navigation, heute |
| `--ok` / `--ok-soft` | `oklch(0.55 0.13 150)` / `oklch(0.94 0.05 150)` | gültig, bestätigt, erfüllt |
| `--warn` / `--warn-soft` | `oklch(0.68 0.15 75)` / `oklch(0.95 0.06 80)` | offen, läuft ab, ausstehend |
| `--bad` / `--bad-soft` | `oklch(0.55 0.19 25)` / `oklch(0.94 0.05 25)` | Konflikt, abgelaufen, Engpass |
| `--alt` / `--alt-soft` | `oklch(0.5 0.12 320)` / `oklch(0.94 0.04 320)` | Stellvertretung, Nichterscheinen |
| `--r` / `--r2` | `6px` / `10px` | Controls / Karten |
| `--pad` | `10px` (kompakt `6px`) | Zeilenhöhe Tabellen |

**Typografie**: IBM Plex Sans (400/500/600) für UI, IBM Plex Mono (400/500) für IDs, Kalenderwochen, Datum, Zahlen. Grössen: 20px/600 Seitentitel im Detail, 18px/600 Header und Dialogtitel, 15px/600 Abschnitt, 14px/600 Panelkopf, 14px Text, 13px Tabellenzelle, 12px Sekundär, 11px Uppercase-Label (`letter-spacing:.06em`). Zahlen immer `font-variant-numeric: tabular-nums`.

**Abstände**: Seitenpadding 24px, Abschnittsabstand 16–20px, Karteninneres 16px, Tabellenzelle `10px 16px`, Gap in Filterzeilen 8px. Mindesthöhe aller Controls 38px (kompakte Variante 30px), Selects mit 34px Freiraum rechts für den eigenen Chevron.

**Motion**: `modalIn` 180ms `cubic-bezier(0.2,0,0,1)` (Opacity + Scale 0.97→1, **Zentrierung im Keyframe mitschreiben**), `toastIn` 200ms ease-out (`translateX(-50%)` beibehalten), `fadeUp` 250ms für Screenwechsel, `slideIn` 250ms für Drawer/Panel, Press-Feedback `scale(0.96)` 120ms. Ein Keyframe darf `transform` nur animieren, wenn es bestehende Verschiebungen mitschreibt – sonst springt das Element.

## Rollen und Zugriff

| Rolle | Sieht | Ändert |
|---|---|---|
| **Planung** (inkl. Admin-Rechte) | alles | Kurse, Zuweisungen, Geräte, Räume, Stammdaten, Regelkonfiguration, Importe |
| **Ausbilder** | eigene Einsätze, eigene Zertifikate, eigene Verfügbarkeit | eigene Ferienanträge, Meldung Zertifikatserneuerung |

Weitere Rollen aus den Requirements (Sales, Geschäftsleitung, Lehrmeister) sind im Prototyp nur in der Rechte-Tabelle unter Einstellungen dokumentiert. Rollenzuweisung im Identitätsanbieter (Clerk oder Entra ID, ADR-0003), **Durchsetzung im Backend** aus dem verifizierten Session-Token; das Frontend blendet nur aus. Der Assistent ist für Ausbilder komplett ausgeblendet (Button und Panel).

## Screens / Views

Navigation: feste Sidebar 220px, gruppiert mit Uppercase-Gruppentiteln – **Planung** (Dashboard, Planungslauf, Zeitplan), **Stammdaten** (Kurse, Ausbilder, Lernende, Berufsschulen, Standorte, Geräte), **System** (Import, Einstellungen); für Ausbilder **Mein Bereich** (Meine Einsätze, Profil & Zertifikate, Ferien). Unten Benutzerkarte mit Initialen-Avatar, Rollenumschalter (Demo) und Abmelden. Header: Titel, Datum («Do 18.9.2026 · KW 38»), rechts Assistent-Toggle.

### 1. Login
Zentrierte Karte, max. 400px: Logo-Quadrat 28px in `--accent`, «SVBL Planung», Formular mit E-Mail und Passwort, Primärbutton, Link «Passwort vergessen?». Darunter Demo-Konten als Pills (Rolle + E-Mail, füllen das Formular) und der Hinweis, dass nur Kontodaten den Identitätsanbieter erreichen – keine Planungs-, Lernenden- oder Zertifikatsdaten. Fehlerfall: `role="alert"` in `--bad-soft`.

### 2. Dashboard
- **Schnellaktionen** (2–3 Karten, flex 1 1 200px): «Planungslauf», «Absenz erfassen», «Nichterscheinen erfassen». Keine Statistik-Kacheln – die Seite ist Einstieg in Abläufe.
- **Planungsläufe**: Karte je Lauf mit Periode, Status (neu / in Arbeit / übernommen), Meta («57 Kurse nötig · 50 terminiert»), 4-Segment-Fortschritt; Klick öffnet den Lauf.
- **Protokoll**: Zeilen mit Punkt, Uppercase-Art (ABSENZ, UMBESETZT, FOLGETERMIN, FERIEN), Beschreibung und Begründung – was bestätigt wurde und warum.
- **Braucht eine Entscheidung** (nur wenn nicht leer, Rahmen `--bad`): Fälle ohne Regel-Lösung mit genau einer Aktion.

### 3. Planungslauf (Kern)
**Übersicht**: vier Intake-Kennzahlen (Neue Lernende gemeldet · Schulen mit neuen Daten «4 / 6» · Lernende ohne eingeteiltes ÜK · Kurse ohne Ausbilder), Button «Neuen Planungslauf starten» (Modal: Schuljahr → Periode, warnt bei Duplikat), Tabelle der Läufe mit Fortschritt und «Fortsetzen» / «Ansehen» / Verwerfen.

**Lauf** mit 4 Stufen als klickbare Leiste (Nummer, Titel, Meta):
1. **Bedarf** – Button «Bedarf für … erzeugen»; Kennzahlen (Lernende, Module, Kurse nötig, Kurstage); Tabelle Jahrgang · Modul (+ Semester, Zeitfenster, Tage) · Standort · **Schultag** (Pill «Schule Mo», Zusatz «ÜK an anderen Tagen») · Lernende · Kurse.
2. **Kurse & Termine** – Vorschlag je Kurs: KW, Wochentage, Raum, Plätze, Hinweis. Kritische Zeilen in `--bad-soft` mit Button **«Lösung finden»**.
3. **Ausbilder** – je Kurs bester Kandidat mit Score und Begründung; ohne Kandidat rot plus «Lösung finden».
4. **Übernahme** – Bilanz (anlegen / mit Ausbilder / ohne / nicht planbar), Button «Übernehmen: N Kurse», nach Commit deaktiviert; Erfolgsbox mit Link zum Zeitplan.

**Lösungsdialog** (520px): Kopf «KONFLIKT» + Betroffenes + Problem; Vorschlagskarte in `--surface-2` mit «VORSCHLAG n VON m», Titel, Warum, 3 Folgen als Punkte; Buttons **Anderer Vorschlag** (links), **Abbrechen**, **Vorschlag übernehmen**. Ohne anwendbare Option steht rechts «Braucht eine Entscheidung ausserhalb des Tools».

### 4. Zeitplan
Umschalter **Wochen** / **Monat**, Filter Standort (inkl. «Nur ÜK-Standorte») und Status, Legende.
- **Wochen**: Raster Standorte × 8 KW, erste Spalte sticky, Kursblöcke mit linkem 3px-Statusrand, Code + Tage, Name, Ausbilder-Nachname, Belegung. **Drag-and-drop** über Wochen und Standorte mit sofortiger Neuprüfung (Toast nennt den Konflikt). Zellen über Standortkapazität in `--warn-soft`.
- **Monat**: 7-Spalten-Raster, Wochenenden abgetönt, KW-Label montags, Kurschips (Klick öffnet Kurs-Drawer).

### 5. Kurs-Drawer (560px, rechts)
Kopf: Code-Chip, Statuspunkt, Name, «Standort · KW · Tage · Sprache · n/max». Abschnitte: **Zugewiesener Ausbilder** (Avatar, Anstellung, Verdict, alle harten Checks je Zeile mit Punkt und Grund, «Zuweisung aufheben») · **Geräte** (n × Typ, Verfügbarkeit, Wartung/Reservierung) · **Kandidaten** (bis 6, Score, Soft-Gründe bzw. verletzte Regeln, «Zuweisen»; ohne machbaren Kandidaten Alternativen-Box mit Standort-/Sprachwechsel) · **Verlauf** (Audit: wann, wer, was). Fuss: «Kurs bestätigen», «Assistent fragen», «Kurs absagen» (Bestätigung nennt Teilnehmerzahl und Folgeanmeldungen).

### 6. Kurse (Stammdaten)
Tabs **Durchführungen** (Code, Kurs, Standort, KW, Tage, Ausbilder, TN, Status) und **Kurstypen** (Karten mit Code, Name, Art, Dauer, Track, Skills, Zertifikate, Geräte, Teilnehmer, Voraussetzung). Button «Kurs anlegen» (Modal mit Kurstyp, Standort, KW, Sprache und Live-Vorschau «2 Kurstage · 6 machbare Ausbilder · Geräte verfügbar»).

### 7. Ausbilder
Liste: Name mit Initialen-Avatar, Anstellung, Standort, Sprachen, Skills. Filter: Suche, Skill, Sprache.
Detail: Kopf mit Avatar, Anstellung/Standort/Sprachen, Badge «n Einsätze KW 38–45»; Tabs
- **Skills & Wissen** – Skill-Chips mit × und Modal «Skill hinzufügen» (nennt zusätzlich mögliche Kurstypen); Gerätequalifikationen (abgeleitet); **Unterrichtbare Kurstypen** mit Prüfindikator und Vorschlägen (aus Skills + gültigen Zertifikaten); **Kontakt** (E-Mail als `mailto:`, Telefon als `tel:`, Heimstandort, max. Reise, Präferenzen; Modal «Bearbeiten»); **Implizites Wissen** als Textfeld mit Speichern und Status.
- **Zertifikate** – Tabelle (Zertifikat, Aussteller, ausgestellt, gültig bis, Status), Zeile «Qualifikationspflege» je Pflicht, Modal «Zertifikat erfassen».
- **Verfügbarkeit** – 8 Wochenzellen (frei / Einsatz / Abwesenheit / Konflikt) und Liste der Abwesenheiten mit Genehmigen/Ablehnen.
- **Einsätze** – geteilte Kalenderkomponente (siehe 12).

### 8. Lernende
Liste mit Filtern Berufsschule, Lehrgang (EFZ/EBA), Jahrgang; Spalten Name, Lehrgang, Jahrgang, Berufsschule, ÜK-Fortschritt als Segmentbalken. Hinweis, dass die Schul-CSV führend ist (keine Bearbeitung).
Detail: Kopf mit Fortschritt («12 von 25 ÜK-Tagen») und Status; Tabs
- **Bildungsplan** – alle Module des Lehrgangs mit Semester, Tagen, Zeitfenster, Durchführung (Datum · Standort · Ausbilder) und Status (besucht / eingeteilt / offen / Nichterscheinen, letztere Zeile `--bad-soft`); fehlende Voraussetzung markiert; «Einplanen» nur bei planbaren Modulen mit hinterlegtem Kurstyp, sonst Hinweis «kein Kurstyp hinterlegt». KPIs: Module besucht, ÜK-Tage, offen, nachzuholen.
- **Kursteilnahmen** – Historie mit Anwesenheit.
- **Stammdaten** – Lesefelder, Standard-Standort, Import-Batch, Kompetenznachweise.

### 9. Berufsschulen
Einfache Tabelle: Schule, **ÜK-Standort** (Select über die 5 ÜK-Zentren), **Schultag** (Mo–Fr), Anzahl Lernende. Beides wirkt direkt in den Planungslauf.

### 10. Standorte / Geräte
- **Standorte**: Suchfeld, Tabelle (Standort mit Adresse und ÜK-Badge, Räume, Kontakt, Berufsschulen). Detail mit Tabs **Räume** (Art, Plätze, Wochenbelegung, nächste Nutzung, Modal «Raum hinzufügen»), **Geräte** (was hier steht, Verfügbarkeitsfenster), **Belegung** (Wochenkalender Räume × Mo–Sa mit Kursblöcken und Geräte-Bilanz, ‹ Heute › Navigation).
- **Geräte**: Filter Typ/Standort/Mobilität, Kennzahlen, Tabelle (Inventar, Typ, Standort heute, **Mobilität: fest / mobil / Miete**, Status, Zeitraum bzw. Bewegung, Einsätze) mit «Verschieben» (mobil, ab KW) und «Rückgabe» (Miete); Button «Mietgerät hinzufügen» (Typ, Anbieter, Standort, von/bis, Vorschau welcher Kurs gedeckt wird).

### 11. Import
Drei Schritte (Quelle & Datei → Spaltenzuordnung → Vorschau & Import). Bei Quelle «Berufsschul-CSV» zusätzlich **Meldestand der Berufsschulen** je Schuljahr: Schule, Standort, Eingangsdatum, Lernende, Status; ausstehende Zeilen `--warn-soft` mit «Datei erfassen»; Zusammenfassung «4 von 6 Schulen gemeldet · offen: …». Vorschau zeigt Zeilen gelesen / neu / aktualisiert / zu prüfen plus Fehlerbericht; Abschluss nennt Batch-Id.

### 12. Einsatzkalender (geteilte Komponente)
Eine Komponente, zwei Einsatzorte: Ausbilder-Detail (Planung) und «Meine Einsätze» (Ausbilder) – im Prototyp `reference/Einsatzkalender.dc.html`, Props: `cal`, `rows`, `leadCount`, `backupCount`, `empty`.
- Kopf: ‹ Heute ›, Titel, Zeitraum, Legende (Leitung `--accent`, Stellvertretung `--alt`, Abwesenheit), Umschalter Woche/Monat.
- **Woche**: Mo–Sa, je Tag Karten mit Zeitspanne, Rollen-Label, Kurs, Standort, «Tag x/y», Teilnehmerzahl und **Blöcken** (Zeit · Raum · Inhalt) – ein Kurstag kann mehrere Blöcke in verschiedenen Räumen haben.
- **Monat**: Raster mit Chips, Klick springt in die Woche.
- Liste «Alle Einsätze» mit vollem Datum, Räumen, Rollen-Badge; Zähler «n als Leitung · m als Stellvertretung».

### 13. Mein Bereich (Ausbilder)
**Meine Einsätze** (Kalender oben) · **Profil & Zertifikate** (Stammdaten, Skills, Präferenzen, Kontakt, Zertifikate mit «Erneuerung melden», **Qualifikationspflege** mit Fortschritt durchgeführt/geplant, Status und «Einsatz bei der Planung anfragen») · **Ferien** (Antrag pro KW mit Warnung bei Einsatz, eigene Anträge zurückziehbar).

### 14. Einstellungen
**Regeln der Matching-Engine**: Warnfrist Zertifikate (14–180 Tage), Vorlauf «Kurs ohne Ausbilder» (1–8 Wochen), Liste der harten Regeln und der weichen mit Gewichten. **Rollen und Rechte**: Tabelle Rolle → sieht → ändert.

### 15. Assistent (Panel 360px rechts)
Kopf: «Assistent», Untertitel «Schlägt vor und begründet – Sie bestätigen». Verlauf mit Nutzerbubbles (`--accent`) und Antworten als **Karte**: Kopf (Titel, Untertitel), optional Schlüssel-Wert-Zeilen, Listenzeilen (Titel, Sub, Kennzahl rechts, Aktionsbutton), Balken, Chips, Fussaktionen. Unten Vorschlagschips und Eingabefeld.

Intents (Reihenfolge = Priorität): Kontakt · **Ersatz für [Ausbilder]** (nur künftige Einsätze) · **Alternativtermin für [Lernende] + Modul** (nur künftige Kurse, freie Plätze gezählt) · Kandidaten für einen Kurs · Zertifikate · offene Kurse · Konflikte · Auslastung · Geräte-Engpässe (Wortgrenzen!) · sonst Absage mit Aufzählung des Könnens. Aktionen in Karten: «Zuweisen», «Einschreiben», «Profil öffnen», «Kurs öffnen». Vorschlagschips: «Ersatz für Roger Federer», «Wer kann ÜK 7 in Rupperswil übernehmen?», «Wann kann Ada Lovelace ÜK 3 nachholen?», «Kontakt von Lara Gut-Behrami», «Welche Zertifikate laufen ab?», «Welche Kurse sind unbesetzt?», «Wo sind Geräte-Engpässe?».

Für die Produktion: LLM nur als Übersetzungsschicht auf **Tool-Calls** gegen diese Endpunkte, kein Freitext-Zugriff auf Rohdaten; Antwortsprache Deutsch; Hosting gemäss ADR-0001 (Schweiz) klären.

## Engine (verbindliche Spezifikation)

Referenzimplementierung: Logikklasse in `reference/SVBL Planung.dc.html`. Alle Funktionen sind rein und gehören in einen Service-Layer mit Unit-Test je Regel.

**`check(course, instructor, ledger?) → {ok, hard[], soft[], score}`**
Harte Regeln (blockieren, jede mit Begründungstext):
1. Instruktor hält **alle** vom Kurstyp geforderten Skills.
2. Jedes geforderte Zertifikat ist **an jedem Kurstag** gültig (nicht nur am Starttag); Meldung nennt Ablaufdatum und den ersten nicht gedeckten Tag.
3. Gerätequalifikation für jeden benötigten Gerätetyp (über Zertifikat oder Skill).
4. Instruktor spricht die Kurssprache.
5. Verfügbarkeit an allen Kurstagen: keine Überschneidung mit anderem Einsatz (inkl. `ledger` = provisorische Zuweisungen desselben Laufs), keine genehmigte/blockierte Abwesenheit.
Weiche Regeln (Score, Start 50): Heimstandort +30 · gleiche Sprachregion +12 · andere Region −10 · bevorzugter Standort +8 · Kontinuität mit dem Jahrgang +10 · festangestellt +5 · offener Ferienantrag −15 · Qualifikationspflege offen +10. Ergebnis 0–100, Gründe als Text mitliefern.

**`deviceCheck(course)`** – je gefordertem Gerätetyp: Bestand am Standort (zeitabhängig!) minus Wartung minus Reservierungen anderer Kurse mit überlappenden Tagen ≥ benötigte Anzahl.
**`deviceAt(device, kw)`** – Standort eines Geräts in einer Woche: fest = Standort; mobil = letzter Umzug ≤ KW; Miete = nur innerhalb `from…until`, sonst nicht vorhanden.
**`maintenance(instructor)`** – Qualifikationspflege je Zertifikatstyp (z. B. IPAF: 5 × ÜK 7 pro Kalenderjahr, Gefahrgut: 2 × ÜK 9); zählt durchgeführte + geplante Leitungen, liefert offen/erfüllt und fliesst als Bonus in den Score.
**`genDemand(period)`** – je Jahrgang das Semester der Periode → Module aus dem Bildungsplan → je Berufsschule Lernendenzahl → Gruppierung **(Standort, Schultag)** → `need = ceil(n / maxTeilnehmer)`.
**`proposeCourses(demand, period)`** – je nötigem Kurs: Wochenfenster der Periode (aktuelle Woche auslassen, wenn die Periode sie enthält); Wochentags-Offset so wählen, dass der **Schultag der Gruppe frei bleibt** – gibt es keinen zusammenhängenden Block, ist der Kurs **nicht planbar** (kein stiller Fallback); Raum nach Art (Praxishalle bei Gerätebedarf, sonst Theorieraum); Ledger für Standortkapazität, Raum-, Geräte- und **Ausbilderbelegung** innerhalb des Laufs.
**`fixOptions(course)`** – Lösungsvorschläge in dieser Reihenfolge: Kurstyp ergänzen · Standort wechseln · Zeitfenster überschreiten · Kurs teilen (zwei echte Blöcke mit eigener KW und eigenem Raum) · Mietgerät (nur wenn allein Geräte fehlen) · Kurssprache wechseln · Woche verschieben · Zertifikat auffrischen. Jede Option: Titel, Warum, Folgen, anwendbarer Patch (oder ausdrücklich nur Hinweis). **Jeder Patch muss durch `freeSlot()` gehen** – die einzige Funktion, die Schultag, Raumart, Kapazität und Gerätebestand prüft.
**`followUp(apprentice, module)`** – nächster künftiger Kurs des Moduls mit freiem Platz und passender Sprache, Standort nächst der Berufsschule bevorzugt.

**Statusflüsse**: Kurs `Bedarf → geplant → offen → bestätigt → laufend → durchgeführt` (abgesagt jederzeit vorher) · Zuweisung `vorgeschlagen → bestätigt | abgelehnt` · Anmeldung `angemeldet → bestätigt → besucht | Nichterscheinen → umgeplant` · Zertifikat `gültig → läuft ab → abgelaufen` · Ferien `beantragt → genehmigt | abgelehnt`.

## Interactions & Behavior

- **Rollenwechsel** blendet Navigation, Aktionen und den Assistenten um; Navigation setzt Detailauswahl zurück (`instrId`, `apprId`, `locId`, `selCourse`).
- **Drag-and-drop** im Zeitplan: `dragstart` setzt die Kurs-Id, Zellen mit `dragover`/`drop`; nach dem Verschieben Neuprüfung, Toast nennt bei Verletzung die Regel; Audit-Eintrag.
- **Vorschlagsdialoge** (Absenz, Nichterscheinen, «Lösung finden»): identische Struktur; «Anderer Vorschlag» blättert zyklisch; Absenz arbeitet eine **Warteschlange** betroffener Einsätze ab («Einsatz 1 von 3»); «Offen lassen» / «Später» protokolliert den Fall als Entscheidung.
- **Bestätigungen** als Toast unten zentriert, 2.6s.
- **Zerstörende Aktionen** (Kurs absagen, Lauf verwerfen) mit Rückfrage, die die Folgen nennt.
- **Formulare** validieren gegen die Engine, nicht nur syntaktisch: Kurs anlegen zeigt live die Zahl machbarer Ausbilder und den Gerätestatus.
- **Tastatur**: Kursblöcke sind `role="button"` mit `tabIndex=0` und Enter/Space; Dialoge `role="dialog" aria-modal="true"` – im Nachbau Fokus fangen und mit Escape schliessen.
- Kalenderwochen niemals als interne Laufnummer ausgeben: im Prototyp rechnet die Engine mit einer fortlaufenden Wochenzählung ab KW 38/2026, angezeigt wird `((kw-1) % 52) + 1`. **Im Produktionsmodell besser `(isoYear, isoWeek)` oder echte Datumsbereiche speichern.**

## State Management

Prototyp hält alles in einer Komponente; für die Produktion Server-State (React Query / Server Actions) plus UI-State:
`courses` (inkl. `room`, `blocks`, `backup`) · `devices` (mit `moves`, `from/until`) · `instrData` (Skills, Zertifikate, Kontakt, Notizen, `teach`, `taught`) · `apprentices` + `history` · `absences` · `runs` (`period`, `stage`, `demand`, `courses`, `committed`) · `autoLog` (Protokoll) · `noShows` · `audit` · Regelparameter (`warnDays`, `leadWeeks`) · Dialoge (`fixDialog`, `propDialog`, `newCourse`, `absDialog`, `noShowDialog`, `devDialog`, `roomDialog`, `skillDialog`, `certDialog`, `contactDialog`, `runDialog`) · Filter und Tabs pro Screen.

Persistenz: PostgreSQL (ADR-0002); jeder Planänderung folgt ein Audit-Eintrag (wer, wann, vorher, nachher). Planungsläufe sind eigene Entität mit ihren Vorschlägen – Wiederaufnahme muss möglich sein.

## Assets

Keine Bilddateien. Icons/Illustrationen: keine Bibliothek nötig – Statusanzeigen sind farbige Punkte (8px), Avatare sind Initialen, der Select-Chevron ist ein 12×8-SVG als Data-URI **im Stylesheet** (nicht inline), Microsoft-Logo im Login wurde entfernt. Fonts: IBM Plex Sans / IBM Plex Mono (Google Fonts) – im Zielprojekt via `next/font` selbst hosten.

## Files

```
reference/
  SVBL Planung.dc.html     Hauptprototyp: alle Screens + Engine (Logikklasse am Dateiende)
  Einsatzkalender.dc.html  geteilte Kalenderkomponente
  support.js               Laufzeit des Prototyp-Formats – NICHT übernehmen
domain/
  Requirements.md          Anforderungskatalog mit Prioritäten und offenen Fragen
  Entities.md              Datenmodell, ER-Diagramme, Constraint-Tabelle, Glossar DE/EN
  Interview Protocol.md    Primärquelle der Planungsregeln (Rohnotizen + Lesehilfe)
  Roadmap.md               Phasen, Deliverables, Team
  Open Questions.md        offene Punkte mit dem Kunden
  ASFL SVBL.md             Kundenprofil, Standorte, Kursangebot
  SVBL.md                  Projektübersicht
TOKENS_AND_ROUTES.md       Tokens, tailwind.config, Klassen-Rezepte, Screen→Route-Mapping
```

## Umsetzungsreihenfolge (Vorschlag)

1. Tokens, Layout-Shell (Sidebar mit Gruppen, Header, Toast, Modal-Primitive mit korrektem Keyframe).
2. Datenmodell in PostgreSQL + Seed aus den Demo-Daten des Prototyps.
3. Engine als getesteter Service (`check`, `deviceCheck`, `deviceAt`, `maintenance`) – Tests je Regel aus der Constraint-Tabelle in `domain/Entities.md`.
4. Stammdaten-Screens (Kurse, Ausbilder, Lernende, Berufsschulen, Standorte, Geräte).
5. Zeitplan (Wochen, Monat, Drag-and-drop) und Kurs-Drawer.
6. Planungslauf mit `genDemand`, `proposeCourses`, `fixOptions` und Übernahme.
7. Dashboard-Abläufe (Absenz, Nichterscheinen, Protokoll, Entscheidungen).
8. Ausbilder-Bereich mit geteiltem Kalender.
9. Import mit Spaltenzuordnung, Fehlerbericht, Provenienz je Zeile.
10. Assistent als Tool-Calling-Schicht über den Engine-Endpunkten.

## Offene Punkte für die Umsetzung

Aus `domain/Open Questions.md`, vor dem Bau zu klären: Identitätsanbieter (Clerk vs. Entra ID) und schriftliche Zustimmung zu US-Hosting der Kontodaten · LLM-Hosting unter der Schweiz-Only-Vorgabe · Zuweisungsgranularität (Kurs vs. Kurstag bei mehrtägigen Kursen mit wechselnden Ausbildern) · Räume als Entität (im Prototyp bereits so modelliert) · Freelancer-Verfügbarkeit (gemeldet oder erfasst) · Überstundenregeln und Arbeitszeitmodelle · exakte Regel der Qualifikationspflege · Mengengerüst (Kurse/Jahr, Geräte) · Parallelbetrieb mit dem Planungs-Excel · UI-Sprachen Französisch und Italienisch (Prototyp ist einsprachig Deutsch, Texte für i18n vorbereiten).
