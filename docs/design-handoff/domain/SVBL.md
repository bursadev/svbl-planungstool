---
type: project
status: active
repo: 
started: 2026-09-04
goal: PoC of an internal course-planning tool for ASFL SVBL with dashboard, rule-based matching engine, and AI assistant
tags: [scheduling, llm, agentic]
---
# SVBL

## Goal
A working proof of concept of an internal planning tool for the course business of ASFL SVBL (Swiss Logistics). Planners see demand, courses, instructors, locations, and devices in one place. A rule-based matching engine checks whether an assignment is feasible (skills, certificates, device qualification, language, availability, location) and proposes alternatives. An AI assistant answers planning questions in natural language on top of the engine without making decisions. Done means the planning team has run real cases from daily business through the tool in a test phase, and SVBL IT can operate it after the handover.

## Current focus
- Phase 1 Einarbeitung: interviews with the planning team and IT; work through the remaining [[30 Projects/SVBL/Notes/Open Questions|open questions]], first SVBL's yes or no on Clerk (ADR-0003) and the LLM hosting under the Swiss-only constraint of ADR-0001.
- Keep [[30 Projects/SVBL/Notes/Requirements|Requirements]] and [[30 Projects/SVBL/Notes/Entities|Entities]] current after every interview.

## Links
- Repo: not created yet
- Client: [[30 Projects/SVBL/Notes/ASFL SVBL|ASFL SVBL]]
- Roadmap (phases, deliverables, team): [[30 Projects/SVBL/Notes/Roadmap|Roadmap]]
- Requirements: [[30 Projects/SVBL/Notes/Requirements|Requirements]]
- Entities and data model: [[30 Projects/SVBL/Notes/Entities|Entities]]
- Interview protocol (primary source): [[30 Projects/SVBL/Notes/Interview Protocol|Interview Protocol]]
- Open questions: [[30 Projects/SVBL/Notes/Open Questions|Open Questions]]
- Dev log: [[30 Projects/SVBL/Log|Log]]
- Decisions: `30 Projects/SVBL/Decisions/`
	- [[ADR-0001 Host in Switzerland on Exoscale]]
	- [[ADR-0002 Use PostgreSQL]]
	- [[ADR-0003 Start with Clerk for Authentication]] (proposed)
- Notes: `30 Projects/SVBL/Notes/`

## Tasks
```tasks
not done
path includes 30 Projects/SVBL
sort by due
```

## Milestones
- [ ] Phase 1 Einarbeitung (2 weeks): IST process, data silos, requirements catalogue with Must/Should/Nice, success criteria
- [ ] Phase 2 Konzept & Datenmodell (3 weeks): data model, matching-engine concept, AI-assistant concept, wireframes, tech stack and hosting, release for implementation
- [ ] Phase 3 Implementierung (8 weeks): import, backend, matching engine, dashboard, AI assistant, test phase with the planning team
- [ ] Phase 4 Abschlussdokumentation (1 week): documentation, user manual, training, handover
