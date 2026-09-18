---
type: note
project: "[[SVBL]]"
---
# Roadmap

Konsolidiert aus den ursprünglichen Notizen `00 - Übersicht` bis `04 - Abschlussdokumentation` (Referenz JUN-26652-26, Stand 2026-07-28). Inhalt unverändert, nur die Navigation zwischen den Phasen wurde entfernt.

## Übersicht

**Ziel:** PoC eines internen Planungstools für Kurse inkl. Dashboard und KI-Assistent für die Disposition von Ausbildern, Standorten und Geräten.

Kunde: [[30 Projects/SVBL/Notes/ASFL SVBL|ASFL SVBL]]

### Phasen

| Phase | Dauer |
|---|---|
| [[#Phase 1 Einarbeitung]] | 2 Wochen |
| [[#Phase 2 Konzept & Datenmodell]] | 3 Wochen |
| [[#Phase 3 Implementierung]] | 8 Wochen |
| [[#Phase 4 Abschlussdokumentation]] | 1 Woche |

### Deliverables

- PoC Planungstool: Dashboard, Matching-Engine, KI-Assistent
- Dokumentation, Benutzerhandbuch und Schulung

### Team

- Projektleiter ETH juniors
	- Oskari Jyrkinen
	- Gregory Stäuber
- 1–2 Experten aus dem ETH juniors Talent Pool
	- Hintergrund in Informatik, Erfahrung mit Webapps und LLM

## Phase 1 Einarbeitung

**Dauer:** 2 Wochen

### Kick-off

- Kennenlernen des Projektteams und Festlegung des Kommunikationskanals
- Kontaktübergabe: IT-Leiter, Planungsteam, Geschäftsleitung
- Übergabe des Planungs-Excels, bestehender Dokumentation und Zugriffsberechtigungen
- Intervall der Updatemeetings und Ansprechpersonen definieren

### Einarbeitung in Unternehmen & Planungsprozess

- Analyse des IST-Prozesses der Kursplanung
	- Wie werden Kurse heute geplant, besetzt und durchgeführt?
- Aufnahme der bestehenden Datensilos
	- Planungs-Excel, OdAOrg, Abacus: Inhalte, Schnittstellen, Verantwortlichkeiten

### Interviews mit dem Planungsteam

- Aufnahme des IST-Prozesses, Identifikation von Pain Points & Needs
- Priorisierung der Use-Cases für den PoC
- Analyse von Struktur und Qualität des Planungs-Excels
	- Identifikation der Entitäten: Kurse, Ausbilder, Skills, Zertifikate (z.B. Gültigkeit 1–5 Jahre), Standorte, Geräte
	- Identifikation von Lücken, Duplikaten und impliziten Regeln

### IT-Interview

- Analyse bestehende Infrastruktur: Microsoft-Umgebung, Server, Cloud-Präferenzen
- Hosting-Entscheid (Cloud vs. On-Prem), Sensibilität der Personendaten
- Absprache Maintenance-Konzept: Befähigung der eigenen Belegschaft, Rolle des IT-Leiters

### Anforderungskatalog & Erfolgskriterien

- Definition Must-have, Should-have und Nice-to-have Funktionalitäten anhand der Aufnahme des IST-Prozess
- Definition der Erfolgskriterien

### Update Meeting mit Swiss Logistics

- Präsentation der Erkenntnisse und Iteration des Anforderungskatalogs

## Phase 2 Konzept & Datenmodell

**Dauer:** 3 Wochen

### Datenmodell & Architektur

- Definition Datenstruktur: Kurse, Ausbilder, Skills, Zertifikate, Standorte, Geräte, Verfügbarkeiten, Kunden
- Abbildung von Zertifikats-Gültigkeiten und rechtlichen Auflagen
- Konzept Import-Pipeline Excel → Datenbank

### Konzept Matching-Engine (regelbasiert)

- Deterministische Machbarkeits-Checks für die Kursplanung anhand Skill-Abgleich, Zertifikatsgültigkeit, Verfügbarkeit (inkl. Überstunden), Standort und Gerät
- Vorschlagslogik: alternative Ausbilder / Termine bei Konflikten
- Alerts für auslaufende Zertifikate und Ressourcen-Engpässe
- Auslastungsdashboard

### Konzept KI-Assistent

- LLM als Abfrage-Schicht über der Matching-Engine (Tool-Calling)
	- Anfragen in natürlicher Sprache werden in deterministische Abfragen übersetzt
- Assistent erklärt und begründet, entscheidet aber nicht
- Auswahl des LLM unter Berücksichtigung des Datenschutzes
	- API-hosted vs. self-hosted, Datenresidenz Schweiz/EU

### Frontend- & Backend-Konzept

- Wireframes Dashboard
	- Chat-Panel, Kurskalender, Auslastungsansicht, Zertifikats-Ampel
- Definition Tech Stack und Hosting
	- React/Next.js, FastAPI, PostgreSQL, Azure
- Access Management: Rollen für Planung, Sales und Geschäftsleitung

### Zwischenmeeting mit Swiss Logistics

- Präsentation und Iteration von Konzept, Datenmodell und Mockups
- Freigabe für die Implementierung

## Phase 3 Implementierung

**Dauer:** 8 Wochen

### Aufsetzen der Entwicklungsumgebung

- Git Repository, Cloud-Umgebung, Deployment-Pipeline (Docker, CI/CD)

### Datenimport & Backend

- Aufsetzen der Datenbank
- Einlesen des bestehenden Planungs-Excels
- REST API für Kurse, Ressourcen und Planungsabfragen
- Access Management und rollenbasierte Zugriffsrechte

### Implementierung Matching-Engine

- Regelbasierte Machbarkeits-Checks
	- Ausbilder × Skills × Zertifikate × Verfügbarkeit × Standort × Gerät
- Vorschlagslogik für Alternativen bei Konflikten
- Auslastungsberechnung und Alerts für auslaufende Zertifikate

### Implementierung Dashboard

- Kurskalender und Ressourcenansicht mit Filter- und Suchfunktionen
- Zertifikats-Ampel und Auslastungsübersicht
- Design angelehnt an die Corporate Identity von Swiss Logistics

### Integration KI-Assistent

- Anbindung des LLM an Matching-Engine und Datenbank (Tool-Calling)
- Abfragen mit nachvollziehbaren Begründungen und Quellen
- Prompt Engineering und Guardrails gegen Halluzinationen

### Testing & Iteration

- Testing & Debugging basierend auf dem Anforderungskatalog
- Testphase durch das Planungsteam (1–2 Wochen)
	- Reale Planungsfälle aus dem Tagesgeschäft

## Phase 4 Abschlussdokumentation

**Dauer:** 1 Woche

### Dokumentation & Benutzerhandbuch

- Erläuterung von Projektverlauf und Funktionsweise
- Benutzerhandbuch Planungstool (Markdown auf GitHub)

### Schulung & Übergabe

- Schulung des Planungsteams und des IT-Leiters
- Übergabe des PoC, der Dokumentation und des Benutzerhandbuches

### Abschlussmeeting mit Swiss Logistics

- Demonstration der Funktionsweise des PoC
- Klären abschliessender Fragen

### Weitere Schritte

- Ausbau zum «Digital Company Brain»
- Kunden-Dashboard und digitale Customer Journey (Login bis Rechnung)
- Push-Benachrichtigungen, Bereitschaftsplanung, Rentabilitätsanalyse der Kurse
