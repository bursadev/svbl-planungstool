---
type: note
project: "[[SVBL]]"
---
# Interview Protocol

Raw notes from the first interview with the planning team (Ausbildner-Planung), as of 2026-09-04. This is the primary source for the domain rules. The notes are kept verbatim, including shorthand and mixed languages. The structured reading of them lives in [[30 Projects/SVBL/Notes/Requirements|Requirements]] and [[30 Projects/SVBL/Notes/Entities|Entities]]; the questions they answered are marked in [[30 Projects/SVBL/Notes/Open Questions|Open Questions]].

## Notes

Freelancer / Teacher (Ausbildner Planung) -> Gregory

- Skills / Profession, Certificates are hard requirements
- For specific devices you need qualifications are also hard requirements
- Language is a specific hard requirements
- Location soft requirement
- Availability hard requirement

Kurse
- Manche Kurse gehen 1 Tag, 2 Tag, 4 Tage
- Wochen übergreifend ist möglich

Standort
- Nächste Berufschule

Lernende
- Grobe Anzahl lernende jedes Jahr 25 Ük (Überbetrieblicher Kurs) Tage
- 25 ÜK pro Lernende über 3 Jahre -> Haben Abhängigkeiten
- Jeder Lernende ist alleine organisierbar
- Kurse werden in Zeitfenster gescheduled (noch offene Kürse)
- Resource Optimization (Gerät & Ausbildner)
- Not coming student -> Directly follow up termin

Erwachsene:
- Zum Teil Samstag Samstag
- Restrictions on what can be seen (Ausbildner)

Ausbildner:
- Implicit knowledge

What is known
- First plan in which week which courses are taken (with location 20 Berufschule -> 5 Standorte)
- Wieviel lernende haben wir pro kurs
- Know which UK von bis (which months) -> Zeitfenster
- Then plan in with locations the courses will be
- We know how many courses we need to take in which week
- Then schooldays are calculated in
- Lehrmeister kann Lernende eintragen
	- Students are then tracked course for course
- Ausbildner werden einbezogen
80% EFZ und 20 EBA (will have different courses)


Publishing webpages is using an integration

Seeing Weekly Overview -> See Text Blöck -> Drag And Drop Editor -> Automatic Allocation


Ausbildner should request vacations


Welche ÜK im welchem Semester (HARD)
Welche Zeit innerhalb des Semesters

Planung:
- Demand -> Kurse -> Zeitfenster -> Availability

Maschinenplanung

Lernende -> Können nicht editiert werden
Scoring Function -> Validierung -> Er ist doppelt drin. Fixing students ->

## How to read these notes

- The first block is the constraint hierarchy for instructor assignment: skills, certificates, device qualifications, language, and availability are hard; location is soft.
- "Nächste Berufschule" means the default location of an apprentice's ÜK is the training centre nearest their vocational school. About 20 schools map onto 5 ÜK locations.
- "25 ÜK pro Lernende über 3 Jahre" with dependencies is the curriculum: the semester of each ÜK module is fixed (HARD), the timing inside the semester is flexible.
- "Planung: Demand -> Kurse -> Zeitfenster -> Availability" is the planning order the tool has to follow.
- "Weekly Overview -> Text Blöck -> Drag And Drop Editor -> Automatic Allocation" is the intended UI evolution, from a read-only week grid to automatic allocation.
- "Lernende -> Können nicht editiert werden" and "Scoring Function -> Validierung" mean apprentices are imported from school CSV exports, never edited by hand, and duplicates are found by a scoring function and fixed in a review step.
