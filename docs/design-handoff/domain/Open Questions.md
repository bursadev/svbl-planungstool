---
type: note
project: "[[SVBL]]"
---
# Open Questions

Fragenkatalog für die [[30 Projects/SVBL/Notes/Roadmap#Phase 1 Einarbeitung|Einarbeitungsphase]] (Kick-off, Interviews mit Planungsteam und IT). Stand 2026-09-04. Eingerückte Antworten stammen aus dem ersten Interview, siehe [[30 Projects/SVBL/Notes/Interview Protocol|Interview Protocol]]. Anforderungen, die an einer offenen Frage hängen, sind in [[30 Projects/SVBL/Notes/Requirements|Requirements]] mit `#question` markiert.

## Datenschutz & Datenresidenz ⚠️

- **Wie viel muss in der Schweiz bleiben?** Nur Personendaten oder alle Daten? Ist EU-Hosting akzeptabel oder strikt CH (z.B. Azure Switzerland North, Exoscale)?
	- → Entschieden 2026-09-16: Hosting und Datenresidenz Schweiz, Exoscale. Alle Daten. [[ADR-0001 Host in Switzerland on Exoscale|ADR-0001]]
- Gibt es interne Datenschutz-Vorgaben / einen Datenschutzverantwortlichen? Anforderungen aus revDSG (nDSG)?
- **Clerk-Problem:** Clerk hostet Nutzerdaten in den USA → Personendaten der SVBL-Mitarbeiter verlassen die Schweiz. Akzeptabel (mit SCC/DPA) oder No-Go? Alternative: Entra ID SSO (SVBL ist Microsoft-Shop) oder self-hosted Auth
	- → Stand 2026-09-16: Clerk ist als schneller Start vorgesehen, hinter einem Adapter austauschbar ([[ADR-0003 Start with Clerk for Authentication|ADR-0003]], proposed). Braucht das schriftliche Ja von SVBL zum US-Hosting der Accountdaten (DPA/SCC). Ohne Ja: Entra ID oder self-hosted
- **LLM:** Dürfen Ausbilder-Namen, Zertifikate, Verfügbarkeiten an ein API-hosted LLM? Pseudonymisierung nötig? Ist Azure OpenAI (CH/EU-Region) akzeptabel oder self-hosted Pflicht?
- Aufbewahrungs-/Löschfristen für Planungs- und Personendaten?

## Daten & Systeme

- **Source of Truth:** Welches System ist führend für was — Planungs-Excel, OdAOrg, Abacus? (Kunden, Rechnungen, Ausbilder-Stammdaten, Kurse)
- Excel: Wie viele Sheets/Zeilen? Wer pflegt es (wie viele Personen gleichzeitig)? Versionskonflikte heute?
- Bleibt das Excel während der Testphase parallel in Betrieb? → Sync-Strategie oder Stichtag-Import?
- Haben OdAOrg und Abacus APIs/Exports? Ist Integration PoC-Scope oder nur Excel-Import?
- Zertifikate: Wo werden sie heute getrackt? Wie läuft der Erneuerungsprozess? Welche SUVA-/rechtlichen Regeln gelten (Gültigkeit 1–5 Jahre)?
	- Müssen nicht erneuert werden
	- Hebebühnekurse (müssen 5 mal im Jahr gegeben werden)
- Datenqualität: Wer bereinigt Lücken/Duplikate vor dem Import? Welche impliziten Regeln existieren nur in den Köpfen der Planer?
	- Lernende -> Matthias -> Kriegen CSV Export von Berufsschulen
	- Ausbildnende -> wir
- Identifier -> Fehlertoleranz

## Planungsprozess & Domänenregeln

- Mengengerüst: Wie viele Kurse/Jahr, Ausbilder, Standorte, Geräte, Kunden?
- Planungshorizont: Wie weit im Voraus wird geplant? Wie häufig sind Änderungen/Absagen?
- Was macht eine gültige Zuweisung aus?
	- Reisezeit zwischen den 11 Standorten relevant?
	- Sprachregionen: Muss der Ausbilder die Kurssprache (D/F/I) sprechen?
	- Überstunden-Regeln, Arbeitszeitmodelle
	- Festangestellte (~70) vs. Freelancer (~140): unterschiedliche Regeln, Kosten, Verfügbarkeitsabfrage?
- Firmenkurse beim Kunden vor Ort: Wie werden externe Standorte geplant?
- Wer entscheidet bei Konflikten? Wer darf Planungen ändern (Vier-Augen-Prinzip)?
- Geräte: Werden Geräte zwischen Standorten verschoben? Wartungsfenster?

## Nutzer & Zugriff

- Wie viele Nutzer gleichzeitig? Rollen: Planung, Sales, Geschäftsleitung — wer darf was sehen/ändern?
- SSO-Wunsch: Login via Microsoft Entra ID statt separatem Account?
- UI-Sprache: Nur Deutsch oder auch F/I?
- Mobile Nutzung nötig oder nur Desktop?

## Hosting, Betrieb & Übergabe

- Azure bestätigt (Roadmap) oder On-Prem-Präferenz? Existiert ein Azure-Tenant? Wer trägt die Cloud-/LLM-Kosten während und nach dem PoC?
	- → Entschieden 2026-09-16: Exoscale (Schweiz) statt Azure, [[ADR-0001 Host in Switzerland on Exoscale|ADR-0001]]. Offen bleiben Organisation/Tenant bei Exoscale und Kostenträger
- Wer betreibt das Tool nach der Übergabe? Kann die IT einen **TypeScript/NestJS**-Stack warten? (Roadmap nannte FastAPI/Python — Abweichung ansprechen)
- Repo-Ownership: GitHub-Org von SVBL oder ETH juniors? Übergabeprozess?
- Erwartungen an Backup, Monitoring, Verfügbarkeit für einen PoC?

## KI-Assistent

- Top-10-Beispielfragen, die das Planungsteam wirklich stellen würde (vor dem Konzept einsammeln!)
- Nur lesende Abfragen oder auch Aktionen ("plane Ausbilder X um")? Roadmap sagt: erklärt, entscheidet nicht → bestätigen
- Antwortsprache Deutsch (Schweizer Kontext, «ss» statt «ß»)?

## Scope & Erfolg

- Messbare Erfolgskriterien: Was muss der PoC können, damit er als Erfolg gilt?
- Testphase: Welche realen Planungsfälle? Parallelbetrieb mit Excel?
- Was ist explizit **nicht** im Scope (Kundenportal, Rechnungen, Push — laut Roadmap «Weitere Schritte»)?

## Interne Entscheidungen (nicht für SVBL)

Jede dieser Entscheidungen wird als ADR in `30 Projects/SVBL/Decisions/` festgehalten, sobald sie fällt.

- Datenbank: PostgreSQL → entschieden 2026-09-16, [[ADR-0002 Use PostgreSQL|ADR-0002]]; managed (Exoscale DBaaS) vs. self-run in Phase 2
- ORM: Drizzle vs. Prisma vs. TypeORM → nach Datenmodell-Komplexität entscheiden
- Frontend: React vs. Solid → Ökosystem/Wartbarkeit durch SVBL-IT spricht für React
- Auth: Clerk als schneller Start, später austauschbar → [[ADR-0003 Start with Clerk for Authentication|ADR-0003]] (proposed), wird mit dem Ja/Nein von SVBL accepted oder rejected. Rollen werden in Clerk zugewiesen, das Backend setzt die Berechtigungen durch
- AI SDK Provider-Wahl → hängt an LLM-Datenschutz-Antwort (s.o.)
