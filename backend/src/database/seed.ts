import 'dotenv/config';
import { DataSource, EntityManager, type ObjectLiteral } from 'typeorm';
import { Apprentice } from '../apprentices/apprentice.entity.js';
import { Enrollment } from '../apprentices/enrollment.entity.js';
import { SchoolClassDay } from '../apprentices/school-class-day.entity.js';
import { SchoolClass } from '../apprentices/school-class.entity.js';
import { TrainingCompany } from '../apprentices/training-company.entity.js';
import { VocationalSchool } from '../apprentices/vocational-school.entity.js';
import { Assignment } from '../courses/assignment.entity.js';
import { CourseDay } from '../courses/course-day.entity.js';
import { CourseTypeCertificate } from '../courses/course-type-certificate.entity.js';
import { CourseTypeDevice } from '../courses/course-type-device.entity.js';
import { CourseTypeSkill } from '../courses/course-type-skill.entity.js';
import { CourseType } from '../courses/course-type.entity.js';
import { Course } from '../courses/course.entity.js';
import { Cohort } from '../curriculum/cohort.entity.js';
import { CurriculumModulePrerequisite } from '../curriculum/curriculum-module-prerequisite.entity.js';
import { CurriculumModule } from '../curriculum/curriculum-module.entity.js';
import { TimeWindow } from '../curriculum/time-window.entity.js';
import { DeviceMove } from '../devices/device-move.entity.js';
import { DeviceTypeQualification } from '../devices/device-type-qualification.entity.js';
import { DeviceType } from '../devices/device-type.entity.js';
import { Device } from '../devices/device.entity.js';
import { Availability } from '../instructors/availability.entity.js';
import { CertificateTypeMaintenanceCourseType } from '../instructors/certificate-type-maintenance-course-type.entity.js';
import { CertificateType } from '../instructors/certificate-type.entity.js';
import { InstructorCertificate } from '../instructors/instructor-certificate.entity.js';
import { InstructorSkill } from '../instructors/instructor-skill.entity.js';
import { Instructor } from '../instructors/instructor.entity.js';
import { Skill } from '../instructors/skill.entity.js';
import { Location } from '../locations/location.entity.js';
import { Room } from '../locations/room.entity.js';
import { buildDataSourceOptions } from './database.options.js';
import {
  AssignmentRole,
  AssignmentStatus,
  AvailabilityKind,
  AvailabilitySource,
  AvailabilityStatus,
  CourseKind,
  CourseStatus,
  DeviceCategory,
  DeviceMobility,
  DeviceStatus,
  EmploymentType,
  EnrollmentChannel,
  EnrollmentStatus,
  Language,
  LocationKind,
  RoomKind,
  Track,
  WeekdayRule,
} from './enums.js';

/**
 * Loads the prototype's demo data (web/src/proto/svbl-planung.logic.ts) into
 * the database: the 11 locations with rooms, skills, certificate types, device
 * types, 12 instructors, the course catalogue, the ÜK curriculum with time
 * windows, 15 courses of autumn 2026 with days and assignments, absences,
 * devices, six vocational schools with classes, and ten apprentices.
 *
 * Wipes every domain table first. Development only.
 */

// The prototype counts weeks from ISO week 38 of 2026; its Monday is 14.9.2026.
const KW38_MONDAY = Date.UTC(2026, 8, 14);
const addDays = (ms: number, n: number): number => ms + n * 864e5;
const monday = (kw: number): number => addDays(KW38_MONDAY, (kw - 38) * 7);
const iso = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
const splitAddress = (
  s: string,
): { addressLine: string; postalCode: string; city: string } => {
  const [addressLine, rest] = s.split(', ');
  const [postalCode, ...city] = rest.split(' ');
  return { addressLine, postalCode, city: city.join(' ') };
};

async function seed(em: EntityManager): Promise<void> {
  const insert = async <T extends ObjectLiteral>(
    cls: new () => T,
    data: Partial<T>,
  ): Promise<T> => em.save(em.create(cls, data as T));

  // --- Locations and rooms -------------------------------------------------
  const R = (name: string, kind: RoomKind, capacity: number) => ({
    name,
    kind,
    capacity,
  });
  const locationData = [
    {
      code: 'RUP',
      name: 'Rupperswil',
      region: Language.De,
      canton: 'AG',
      uk: true,
      cap: 3,
      address: 'Industriestrasse 12, 5102 Rupperswil',
      contact: 'Sandra Meier',
      rooms: [
        R('Raum 1.01', RoomKind.Theory, 16),
        R('Raum 1.04', RoomKind.Theory, 12),
        R('Halle A', RoomKind.PracticeHall, 8),
        R('Halle B', RoomKind.PracticeHall, 8),
        R('Aussenplatz', RoomKind.Outdoor, 6),
      ],
    },
    {
      code: 'ZOF',
      name: 'Zofingen',
      region: Language.De,
      canton: 'AG',
      uk: false,
      cap: 2,
      address: 'Hintere Hauptgasse 3, 4800 Zofingen',
      contact: 'Peter Lang',
      rooms: [
        R('Raum 1', RoomKind.Theory, 14),
        R('Aussenplatz', RoomKind.Outdoor, 6),
      ],
    },
    {
      code: 'MUT',
      name: 'Muttenz',
      region: Language.De,
      canton: 'BL',
      uk: false,
      cap: 2,
      address: 'Rheinstrasse 40, 4132 Muttenz',
      contact: 'Nadia Rossi',
      rooms: [
        R('Raum 1', RoomKind.Theory, 12),
        R('Halle 1', RoomKind.PracticeHall, 6),
      ],
    },
    {
      code: 'BER',
      name: 'Bern',
      region: Language.De,
      canton: 'BE',
      uk: true,
      cap: 3,
      address: 'Wankdorffeldstrasse 100, 3014 Bern',
      contact: 'Thomas Graf',
      rooms: [
        R('Raum 2.01', RoomKind.Theory, 16),
        R('Raum 3.02', RoomKind.Theory, 12),
        R('Halle 1', RoomKind.PracticeHall, 8),
        R('Halle 2', RoomKind.PracticeHall, 8),
      ],
    },
    {
      code: 'GOL',
      name: 'Goldach',
      region: Language.De,
      canton: 'SG',
      uk: false,
      cap: 1,
      address: 'Hafenstrasse 7, 9403 Goldach',
      contact: 'Rita Kunz',
      rooms: [
        R('Raum 1', RoomKind.Theory, 12),
        R('Halle 1', RoomKind.PracticeHall, 6),
      ],
    },
    {
      code: 'GUN',
      name: 'Gunzgen',
      region: Language.De,
      canton: 'SO',
      uk: false,
      cap: 1,
      address: 'Logistikpark 2, 4617 Gunzgen',
      contact: 'Urs Baumann',
      rooms: [R('Raum 1', RoomKind.Theory, 12)],
    },
    {
      code: 'RUM',
      name: 'Rümlang',
      region: Language.De,
      canton: 'ZH',
      uk: true,
      cap: 2,
      address: 'Riedmattstrasse 9, 8153 Rümlang',
      contact: 'Karin Frey',
      rooms: [
        R('Raum 1.04', RoomKind.Theory, 14),
        R('Raum 2.03', RoomKind.Theory, 12),
        R('Halle 2', RoomKind.PracticeHall, 8),
      ],
    },
    {
      code: 'MAR',
      name: 'Marly',
      region: Language.Fr,
      canton: 'FR',
      uk: true,
      cap: 2,
      address: 'Route de la Gruyère 1, 1723 Marly',
      contact: 'Luc Bovet',
      rooms: [
        R('Salle 1', RoomKind.Theory, 14),
        R('Halle A', RoomKind.PracticeHall, 8),
      ],
    },
    {
      code: 'CHA',
      name: 'Chavornay',
      region: Language.Fr,
      canton: 'VD',
      uk: false,
      cap: 1,
      address: 'Zone industrielle 4, 1373 Chavornay',
      contact: 'Anne Dubois',
      rooms: [R('Salle 1', RoomKind.Theory, 12)],
    },
    {
      code: 'GIU',
      name: 'Giubiasco',
      region: Language.It,
      canton: 'TI',
      uk: true,
      cap: 2,
      address: 'Via Industria 5, 6512 Giubiasco',
      contact: 'Marco Bianchi',
      rooms: [
        R('Aula', RoomKind.Theory, 16),
        R('Halle 1', RoomKind.PracticeHall, 8),
      ],
    },
    {
      code: 'RIA',
      name: 'Riazzino',
      region: Language.It,
      canton: 'TI',
      uk: false,
      cap: 1,
      address: 'Via Cantonale 22, 6595 Riazzino',
      contact: 'Elena Conti',
      rooms: [R('Aula', RoomKind.Theory, 12)],
    },
  ];
  const locations = new Map<string, Location>();
  const rooms = new Map<string, Room>(); // key: `${code}|${name}`
  for (const l of locationData) {
    const loc = await insert(Location, {
      code: l.code,
      name: l.name,
      kind: LocationKind.TrainingCentre,
      ...splitAddress(l.address),
      canton: l.canton,
      languageRegion: l.region,
      hostsUk: l.uk,
      parallelCourseCapacity: l.cap,
      contactName: l.contact,
    });
    locations.set(l.code, loc);
    for (const r of l.rooms) {
      rooms.set(
        `${l.code}|${r.name}`,
        await insert(Room, { locationId: loc.id, ...r }),
      );
    }
  }
  const locByName = (name: string): Location =>
    [...locations.values()].find((l) => l.name === name)!;

  // --- Skills, certificate types, device types ----------------------------
  const skills = new Map<string, Skill>();
  for (const name of [
    'Lagerlogistik',
    'Kommissionieren',
    'Stapler',
    'Hebebühne',
    'Gefahrgut',
    'Arbeitssicherheit',
  ]) {
    skills.set(name, await insert(Skill, { name }));
  }

  const certTypeData = [
    { code: 'SUVA', name: 'SUVA Staplerinstruktor', issuer: 'SUVA', years: 5 },
    {
      code: 'IPAF',
      name: 'IPAF Instruktor',
      issuer: 'IPAF',
      years: 5,
      maint: { min: 5, types: ['UK07'] },
    },
    {
      code: 'SDR',
      name: 'Gefahrgut SDR/ADR',
      issuer: 'ASTAG',
      years: 3,
      maint: { min: 2, types: ['UK09'] },
    },
    { code: 'EH', name: 'Erste Hilfe BLS-AED', issuer: 'intern', years: 2 },
  ];
  const certTypes = new Map<string, CertificateType>();
  for (const c of certTypeData) {
    certTypes.set(
      c.code,
      await insert(CertificateType, {
        code: c.code,
        name: c.name,
        issuer: c.issuer,
        validityYears: c.years,
        maintenanceMinPerYear: c.maint?.min ?? null,
      }),
    );
  }

  const devTypeData = [
    {
      code: 'STS',
      name: 'Stapler Kat. S',
      category: DeviceCategory.Forklift,
      cert: 'SUVA',
    },
    {
      code: 'STR1',
      name: 'Stapler Kat. R1',
      category: DeviceCategory.Forklift,
      cert: 'SUVA',
    },
    {
      code: 'HB',
      name: 'Hebebühne',
      category: DeviceCategory.AerialPlatform,
      cert: 'IPAF',
    },
  ];
  const devTypes = new Map<string, DeviceType>();
  for (const d of devTypeData) {
    const dt = await insert(DeviceType, {
      code: d.code,
      name: d.name,
      category: d.category,
    });
    devTypes.set(d.code, dt);
    await insert(DeviceTypeQualification, {
      deviceTypeId: dt.id,
      certificateTypeId: certTypes.get(d.cert)!.id,
      skillId: null,
    });
  }

  // --- Course types -------------------------------------------------------
  const UK_LANGS = [Language.De, Language.Fr, Language.It];
  type CourseTypeSeed = {
    key: string;
    code: string;
    name: string;
    kind: CourseKind;
    track: Track | null;
    days: number;
    sat?: boolean;
    skills: string[];
    certs: string[];
    devs: { t: string; n: number }[];
    max: number;
    sem?: number;
    prereq?: string;
  };
  const courseTypeData: CourseTypeSeed[] = [
    {
      key: 'UK01',
      code: 'ÜK 1',
      name: 'Grundlagen Lagerlogistik',
      kind: CourseKind.Uk,
      track: Track.Efz,
      days: 2,
      skills: ['Lagerlogistik'],
      certs: [],
      devs: [],
      max: 12,
      sem: 1,
    },
    {
      key: 'UK02',
      code: 'ÜK 2',
      name: 'Wareneingang & Kontrolle',
      kind: CourseKind.Uk,
      track: Track.Efz,
      days: 2,
      skills: ['Lagerlogistik'],
      certs: [],
      devs: [],
      max: 12,
      sem: 1,
    },
    {
      key: 'UK03',
      code: 'ÜK 3',
      name: 'Kommissionieren & Lagertechnik',
      kind: CourseKind.Uk,
      track: Track.Efz,
      days: 2,
      skills: ['Kommissionieren'],
      certs: [],
      devs: [],
      max: 12,
      sem: 2,
      prereq: 'UK01',
    },
    {
      key: 'UK04',
      code: 'ÜK 4',
      name: 'Verpackung & Warenausgang',
      kind: CourseKind.Uk,
      track: Track.Efz,
      days: 2,
      skills: ['Kommissionieren'],
      certs: [],
      devs: [],
      max: 12,
      sem: 2,
    },
    {
      key: 'UK05',
      code: 'ÜK 5',
      name: 'Flurförderzeuge Kat. S',
      kind: CourseKind.Uk,
      track: Track.Efz,
      days: 4,
      skills: ['Stapler'],
      certs: ['SUVA'],
      devs: [{ t: 'STS', n: 4 }],
      max: 8,
      sem: 3,
      prereq: 'UK01',
    },
    {
      key: 'UK06',
      code: 'ÜK 6',
      name: 'Lagerbewirtschaftung & IT',
      kind: CourseKind.Uk,
      track: Track.Efz,
      days: 2,
      skills: ['Lagerlogistik'],
      certs: [],
      devs: [],
      max: 12,
      sem: 3,
    },
    {
      key: 'UK07',
      code: 'ÜK 7',
      name: 'Hebebühnen (IPAF)',
      kind: CourseKind.Uk,
      track: Track.Efz,
      days: 2,
      skills: ['Hebebühne'],
      certs: ['IPAF'],
      devs: [{ t: 'HB', n: 2 }],
      max: 8,
      sem: 4,
      prereq: 'UK05',
    },
    {
      key: 'UK08',
      code: 'ÜK 8',
      name: 'Transportwesen',
      kind: CourseKind.Uk,
      track: Track.Efz,
      days: 2,
      skills: ['Lagerlogistik'],
      certs: [],
      devs: [],
      max: 12,
      sem: 4,
    },
    {
      key: 'UK09',
      code: 'ÜK 9',
      name: 'Gefahrgut & Arbeitssicherheit',
      kind: CourseKind.Uk,
      track: Track.Efz,
      days: 1,
      skills: ['Gefahrgut'],
      certs: ['SDR'],
      devs: [],
      max: 12,
      sem: 5,
    },
    {
      key: 'UK10',
      code: 'ÜK 10',
      name: 'Materialwirtschaft',
      kind: CourseKind.Uk,
      track: Track.Efz,
      days: 2,
      skills: ['Kommissionieren'],
      certs: [],
      devs: [],
      max: 12,
      sem: 5,
    },
    {
      key: 'UK11',
      code: 'ÜK 11',
      name: 'Qualität & Prozesse',
      kind: CourseKind.Uk,
      track: Track.Efz,
      days: 2,
      skills: ['Arbeitssicherheit'],
      certs: [],
      devs: [],
      max: 12,
      sem: 6,
    },
    {
      key: 'UK12',
      code: 'ÜK 12',
      name: 'Repetition & Kompetenznachweis',
      kind: CourseKind.Uk,
      track: Track.Efz,
      days: 2,
      skills: ['Lagerlogistik'],
      certs: [],
      devs: [],
      max: 12,
      sem: 6,
      prereq: 'UK11',
    },
    {
      key: 'EBA1',
      code: 'ÜK 1 EBA',
      name: 'Grundlagen Lager',
      kind: CourseKind.Uk,
      track: Track.Eba,
      days: 2,
      skills: ['Lagerlogistik'],
      certs: [],
      devs: [],
      max: 10,
      sem: 1,
    },
    {
      key: 'EBA2',
      code: 'ÜK 2 EBA',
      name: 'Lager & Kommissionieren',
      kind: CourseKind.Uk,
      track: Track.Eba,
      days: 2,
      skills: ['Lagerlogistik'],
      certs: [],
      devs: [],
      max: 10,
      sem: 2,
    },
    {
      key: 'EBA3',
      code: 'ÜK 3 EBA',
      name: 'Warenausgang & Transport',
      kind: CourseKind.Uk,
      track: Track.Eba,
      days: 2,
      skills: ['Lagerlogistik'],
      certs: [],
      devs: [],
      max: 10,
      sem: 3,
    },
    {
      key: 'EBA4',
      code: 'ÜK 4 EBA',
      name: 'Repetition & Kompetenznachweis',
      kind: CourseKind.Uk,
      track: Track.Eba,
      days: 2,
      skills: ['Lagerlogistik'],
      certs: [],
      devs: [],
      max: 10,
      sem: 4,
      prereq: 'EBA3',
    },
    {
      key: 'STR1',
      code: 'ST-R1',
      name: 'Staplerkurs R1 Grundkurs',
      kind: CourseKind.Adult,
      track: null,
      days: 4,
      sat: true,
      skills: ['Stapler'],
      certs: ['SUVA'],
      devs: [{ t: 'STR1', n: 3 }],
      max: 6,
    },
    {
      key: 'WPST',
      code: 'WP-ST',
      name: 'Wiederholungsprüfung Stapler',
      kind: CourseKind.Exam,
      track: null,
      days: 1,
      skills: ['Stapler'],
      certs: ['SUVA'],
      devs: [{ t: 'STS', n: 2 }],
      max: 6,
    },
  ];
  const courseTypes = new Map<string, CourseType>();
  for (const t of courseTypeData) {
    const ct = await insert(CourseType, {
      code: t.code,
      name: t.name,
      kind: t.kind,
      track: t.track,
      durationDays: t.days,
      maySpanWeeks: !!t.sat,
      weekdayRule: t.sat ? WeekdayRule.Saturday : WeekdayRule.Weekdays,
      languages: t.kind === CourseKind.Uk ? UK_LANGS : [Language.De],
      maxParticipants: t.max,
    });
    courseTypes.set(t.key, ct);
    for (const s of t.skills)
      await insert(CourseTypeSkill, {
        courseTypeId: ct.id,
        skillId: skills.get(s)!.id,
      });
    for (const c of t.certs)
      await insert(CourseTypeCertificate, {
        courseTypeId: ct.id,
        certificateTypeId: certTypes.get(c)!.id,
      });
    for (const d of t.devs)
      await insert(CourseTypeDevice, {
        courseTypeId: ct.id,
        deviceTypeId: devTypes.get(d.t)!.id,
        quantity: d.n,
      });
  }
  for (const c of certTypeData) {
    for (const key of c.maint?.types ?? []) {
      await insert(CertificateTypeMaintenanceCourseType, {
        certificateTypeId: certTypes.get(c.code)!.id,
        courseTypeId: courseTypes.get(key)!.id,
      });
    }
  }

  // --- Curriculum, cohorts, time windows ----------------------------------
  const modules = new Map<string, CurriculumModule>();
  const sequence: Record<string, number> = {};
  for (const t of courseTypeData.filter((x) => x.sem)) {
    const track = t.track!;
    sequence[track] = (sequence[track] ?? 0) + 1;
    modules.set(
      t.key,
      await insert(CurriculumModule, {
        track,
        courseTypeId: courseTypes.get(t.key)!.id,
        semester: t.sem!,
        sequence: sequence[track],
      }),
    );
  }
  for (const t of courseTypeData.filter((x) => x.prereq)) {
    await insert(CurriculumModulePrerequisite, {
      moduleId: modules.get(t.key)!.id,
      prerequisiteModuleId: modules.get(t.prereq!)!.id,
    });
  }

  const cohortData = [
    { label: '2025 EFZ', track: Track.Efz, startYear: 2025, endYear: 2028 },
    { label: '2026 EFZ', track: Track.Efz, startYear: 2026, endYear: 2029 },
    { label: '2026 EBA', track: Track.Eba, startYear: 2026, endYear: 2028 },
  ];
  const cohorts = new Map<string, Cohort>();
  for (const c of cohortData) {
    cohorts.set(
      c.label,
      await insert(Cohort, {
        track: c.track,
        startYear: c.startYear,
        label: c.label,
        expectedEndYear: c.endYear,
      }),
    );
  }

  // Window months per module from the prototype's curriculum table.
  const windowMonths: Record<string, [number, number]> = {
    UK01: [9, 11],
    UK02: [11, 1],
    UK03: [2, 4],
    UK04: [4, 6],
    UK05: [9, 12],
    UK06: [11, 1],
    UK07: [2, 4],
    UK08: [4, 6],
    UK09: [9, 12],
    UK10: [11, 1],
    UK11: [2, 4],
    UK12: [4, 6],
    EBA1: [9, 11],
    EBA2: [2, 4],
    EBA3: [9, 12],
    EBA4: [2, 4],
  };
  const lastDay = (y: number, m: number): string => iso(Date.UTC(y, m, 0));
  for (const c of cohortData) {
    for (const t of courseTypeData.filter(
      (x) => x.sem && x.track === c.track,
    )) {
      const [m1, m2] = windowMonths[t.key];
      const academicYear = c.startYear + Math.floor((t.sem! - 1) / 2);
      const y1 = t.sem! % 2 === 1 ? academicYear : academicYear + 1;
      const y2 = m2 >= m1 ? y1 : y1 + 1;
      await insert(TimeWindow, {
        curriculumModuleId: modules.get(t.key)!.id,
        cohortId: cohorts.get(c.label)!.id,
        startsOn: iso(Date.UTC(y1, m1 - 1, 1)),
        endsOn: lastDay(y2, m2),
        locationId: null,
      });
    }
  }

  // --- Instructors --------------------------------------------------------
  type InstructorSeed = {
    key: string;
    name: string;
    email: string;
    phone: string;
    emp: EmploymentType;
    loc: string;
    langs: Language[];
    skills: string[];
    certs: { t: string; issued: string; until: string }[];
    notes: string;
    maxTravel: number;
    pref: string[];
    avoid?: string[];
  };
  const instructorData: InstructorSeed[] = [
    {
      key: 'i1',
      name: 'Roger Federer',
      email: 'roger.federer@svbl.ch',
      phone: '+41 62 123 45 01',
      emp: EmploymentType.Employee,
      loc: 'RUP',
      langs: [Language.De, Language.Fr],
      skills: ['Lagerlogistik', 'Stapler', 'Hebebühne'],
      certs: [
        { t: 'SUVA', issued: '2023-03-31', until: '2028-03-31' },
        { t: 'IPAF', issued: '2021-10-05', until: '2026-10-05' },
        { t: 'EH', issued: '2025-05-01', until: '2027-05-01' },
      ],
      notes:
        'Übernimmt gern Kurse in Rupperswil und Zofingen. Sehr gut mit jungen Lernenden.',
      maxTravel: 60,
      pref: ['Rupperswil', 'Zofingen'],
    },
    {
      key: 'i2',
      name: 'Martina Hingis',
      email: 'martina.hingis@freelance.ch',
      phone: '+41 79 220 11 44',
      emp: EmploymentType.Freelancer,
      loc: 'RUM',
      langs: [Language.De],
      skills: ['Lagerlogistik', 'Gefahrgut'],
      certs: [{ t: 'SDR', issued: '2025-01-15', until: '2028-01-15' }],
      notes: 'Nur Di–Do verfügbar, Freitag nach Absprache.',
      maxTravel: 45,
      pref: ['Rümlang'],
    },
    {
      key: 'i3',
      name: 'Bruno Ganz',
      email: 'bruno.ganz@svbl.ch',
      phone: '+41 31 123 45 02',
      emp: EmploymentType.Employee,
      loc: 'BER',
      langs: [Language.De, Language.Fr],
      skills: ['Stapler', 'Hebebühne'],
      certs: [
        { t: 'SUVA', issued: '2022-06-01', until: '2027-06-01' },
        { t: 'IPAF', issued: '2021-08-01', until: '2026-08-01' },
      ],
      notes: 'IPAF-Auffrischung ist beantragt, Termin offen.',
      maxTravel: 90,
      pref: ['Bern'],
    },
    {
      key: 'i4',
      name: 'Ursula Andress',
      email: 'ursula.andress@freelance.ch',
      phone: '+41 79 441 08 23',
      emp: EmploymentType.Freelancer,
      loc: 'BER',
      langs: [Language.De, Language.Fr, Language.It],
      skills: ['Lagerlogistik', 'Kommissionieren'],
      certs: [{ t: 'EH', issued: '2025-02-01', until: '2027-02-01' }],
      notes: 'Dreisprachig; ideal für Marly und Giubiasco.',
      maxTravel: 120,
      pref: ['Bern', 'Marly'],
    },
    {
      key: 'i5',
      name: 'Stan Wawrinka',
      email: 'stan.wawrinka@svbl.ch',
      phone: '+41 26 123 45 03',
      emp: EmploymentType.Employee,
      loc: 'MAR',
      langs: [Language.Fr, Language.De],
      skills: ['Stapler', 'Lagerlogistik'],
      certs: [{ t: 'SUVA', issued: '2024-02-01', until: '2029-02-01' }],
      notes: '',
      maxTravel: 60,
      pref: ['Marly', 'Chavornay'],
    },
    {
      key: 'i6',
      name: 'Lara Gut-Behrami',
      email: 'lara.gut@freelance.ch',
      phone: '+41 79 512 76 90',
      emp: EmploymentType.Freelancer,
      loc: 'GIU',
      langs: [Language.It, Language.De],
      skills: ['Lagerlogistik', 'Stapler'],
      certs: [{ t: 'SUVA', issued: '2023-09-01', until: '2028-09-01' }],
      notes: 'Einzige Staplerinstruktorin im Tessin.',
      maxTravel: 30,
      pref: ['Giubiasco', 'Riazzino'],
    },
    {
      key: 'i7',
      name: 'Simone Niggli-Luder',
      email: 'simone.niggli@svbl.ch',
      phone: '+41 31 123 45 04',
      emp: EmploymentType.Employee,
      loc: 'BER',
      langs: [Language.De],
      skills: ['Lagerlogistik', 'Gefahrgut', 'Kommissionieren'],
      certs: [
        { t: 'SDR', issued: '2024-06-01', until: '2027-06-01' },
        { t: 'EH', issued: '2026-01-10', until: '2028-01-10' },
      ],
      notes: 'Möchte nicht mit Ganz im selben Kurs eingesetzt werden.',
      maxTravel: 60,
      pref: ['Bern'],
      avoid: ['i3'],
    },
    {
      key: 'i8',
      name: 'Xherdan Shaqiri',
      email: 'xherdan.shaqiri@freelance.ch',
      phone: '+41 79 883 21 05',
      emp: EmploymentType.Freelancer,
      loc: 'RUM',
      langs: [Language.De],
      skills: ['Stapler'],
      certs: [{ t: 'SUVA', issued: '2022-11-01', until: '2027-11-01' }],
      notes: 'Samstagskurse bevorzugt.',
      maxTravel: 45,
      pref: ['Rümlang', 'Zofingen'],
    },
    {
      key: 'i9',
      name: 'Beat Feuz',
      email: 'beat.feuz@svbl.ch',
      phone: '+41 62 123 45 05',
      emp: EmploymentType.Employee,
      loc: 'RUP',
      langs: [Language.De],
      skills: ['Hebebühne', 'Stapler'],
      certs: [
        { t: 'IPAF', issued: '2024-04-01', until: '2029-04-01' },
        { t: 'SUVA', issued: '2023-01-01', until: '2028-01-01' },
      ],
      notes: '',
      maxTravel: 90,
      pref: ['Rupperswil', 'Bern'],
    },
    {
      key: 'i10',
      name: 'Emil Steinberger',
      email: 'emil.steinberger@freelance.ch',
      phone: '+41 79 604 33 17',
      emp: EmploymentType.Freelancer,
      loc: 'ZOF',
      langs: [Language.De, Language.Fr],
      skills: ['Lagerlogistik', 'Arbeitssicherheit'],
      certs: [],
      notes: 'Nur 1-Tages- und 2-Tages-Kurse.',
      maxTravel: 30,
      pref: ['Zofingen', 'Rupperswil'],
    },
    {
      key: 'i11',
      name: 'Belinda Bencic',
      email: 'belinda.bencic@svbl.ch',
      phone: '+41 44 123 45 06',
      emp: EmploymentType.Employee,
      loc: 'RUM',
      langs: [Language.De],
      skills: ['Lagerlogistik', 'Kommissionieren'],
      certs: [{ t: 'EH', issued: '2024-09-01', until: '2026-09-01' }],
      notes: '',
      maxTravel: 60,
      pref: ['Rümlang'],
    },
    {
      key: 'i12',
      name: 'Marco Odermatt',
      email: 'marco.odermatt@freelance.ch',
      phone: '+41 79 771 55 28',
      emp: EmploymentType.Freelancer,
      loc: 'GOL',
      langs: [Language.De],
      skills: ['Stapler', 'Hebebühne'],
      certs: [
        { t: 'IPAF', issued: '2025-03-01', until: '2030-03-01' },
        { t: 'SUVA', issued: '2021-11-20', until: '2026-11-20' },
      ],
      notes: 'Reist ungern über 1 h.',
      maxTravel: 60,
      pref: ['Goldach', 'Rümlang'],
    },
  ];
  const instructors = new Map<string, Instructor>();
  for (const i of instructorData) {
    const [firstName, ...rest] = i.name.split(' ');
    const ins = await insert(Instructor, {
      firstName,
      lastName: rest.join(' '),
      email: i.email,
      phone: i.phone,
      employmentType: i.emp,
      homeLocationId: locations.get(i.loc)!.id,
      languages: i.langs,
      maxTravelMinutes: i.maxTravel,
      preferences: {
        preferredLocationIds: i.pref.map((n) => locByName(n).id),
        notes: i.notes || undefined,
      },
    });
    instructors.set(i.key, ins);
    for (const s of i.skills)
      await insert(InstructorSkill, {
        instructorId: ins.id,
        skillId: skills.get(s)!.id,
      });
    for (const c of i.certs)
      await insert(InstructorCertificate, {
        instructorId: ins.id,
        certificateTypeId: certTypes.get(c.t)!.id,
        issuedOn: c.issued,
        validUntil: c.until,
      });
  }
  // Second pass for the avoid-list, which needs the other instructor's id.
  for (const i of instructorData.filter((x) => x.avoid)) {
    const ins = instructors.get(i.key)!;
    ins.preferences = {
      ...ins.preferences,
      avoidInstructorIds: i.avoid!.map((k) => instructors.get(k)!.id),
    };
    await em.save(ins);
  }

  // --- Absences -----------------------------------------------------------
  const absenceData = [
    {
      instr: 'i8',
      kw: 41,
      kind: AvailabilityKind.Vacation,
      status: AvailabilityStatus.Approved,
    },
    {
      instr: 'i11',
      kw: 43,
      kind: AvailabilityKind.Vacation,
      status: AvailabilityStatus.Requested,
    },
    {
      instr: 'i1',
      kw: 44,
      kind: AvailabilityKind.Training,
      status: AvailabilityStatus.Approved,
    },
    {
      instr: 'i3',
      kw: 42,
      kind: AvailabilityKind.Vacation,
      status: AvailabilityStatus.Approved,
    },
  ];
  for (const a of absenceData) {
    await insert(Availability, {
      instructorId: instructors.get(a.instr)!.id,
      startsOn: iso(monday(a.kw)),
      endsOn: iso(addDays(monday(a.kw), 4)),
      kind: a.kind,
      status: a.status,
      source:
        a.kind === AvailabilityKind.Vacation
          ? AvailabilitySource.Request
          : AvailabilitySource.Manual,
    });
  }

  // --- Devices ------------------------------------------------------------
  type DeviceSeed = {
    id: string;
    type: string;
    loc: string;
    status?: DeviceStatus;
    mobility?: DeviceMobility;
    moveTo?: { kw: number; to: string };
    rental?: { from: number; until: number; vendor: string };
  };
  const deviceData: DeviceSeed[] = [
    ...[1, 2, 3, 4, 5].map((n) => ({
      id: `RUP-S${n}`,
      type: 'STS',
      loc: 'RUP',
      status: n === 5 ? DeviceStatus.Maintenance : DeviceStatus.Available,
    })),
    { id: 'RUP-H1', type: 'HB', loc: 'RUP', mobility: DeviceMobility.Mobile },
    {
      id: 'RUP-H2',
      type: 'HB',
      loc: 'RUP',
      mobility: DeviceMobility.Mobile,
      moveTo: { kw: 41, to: 'BER' },
    },
    {
      id: 'MIETE-H1',
      type: 'HB',
      loc: 'GIU',
      mobility: DeviceMobility.Rental,
      rental: { from: 45, until: 46, vendor: 'Rent-a-Lift AG' },
    },
    { id: 'BER-S1', type: 'STS', loc: 'BER' },
    { id: 'BER-S2', type: 'STS', loc: 'BER' },
    { id: 'BER-S3', type: 'STS', loc: 'BER' },
    { id: 'BER-H1', type: 'HB', loc: 'BER', mobility: DeviceMobility.Mobile },
    { id: 'BER-H2', type: 'HB', loc: 'BER', mobility: DeviceMobility.Mobile },
    ...[1, 2, 3, 4].map((n) => ({ id: `RUM-S${n}`, type: 'STS', loc: 'RUM' })),
    ...[1, 2, 3].map((n) => ({ id: `MAR-S${n}`, type: 'STS', loc: 'MAR' })),
    { id: 'GIU-S1', type: 'STS', loc: 'GIU' },
    { id: 'GIU-S2', type: 'STS', loc: 'GIU' },
    { id: 'GIU-H1', type: 'HB', loc: 'GIU', mobility: DeviceMobility.Mobile },
    ...[1, 2, 3].map((n) => ({ id: `ZOF-R${n}`, type: 'STR1', loc: 'ZOF' })),
  ];
  for (const d of deviceData) {
    const dev = await insert(Device, {
      deviceTypeId: devTypes.get(d.type)!.id,
      inventoryNumber: d.id,
      homeLocationId: locations.get(d.loc)!.id,
      mobility: d.mobility ?? DeviceMobility.Fixed,
      status: d.status ?? DeviceStatus.Available,
      rentalFrom: d.rental ? iso(monday(d.rental.from)) : null,
      rentalUntil: d.rental ? iso(addDays(monday(d.rental.until), 6)) : null,
      rentalVendor: d.rental?.vendor ?? null,
    });
    if (d.moveTo) {
      await insert(DeviceMove, {
        deviceId: dev.id,
        fromLocationId: locations.get(d.loc)!.id,
        toLocationId: locations.get(d.moveTo.to)!.id,
        effectiveOn: iso(monday(d.moveTo.kw)),
      });
    }
  }

  // --- Courses, days, assignments ----------------------------------------
  const statusMap: Record<string, CourseStatus> = {
    laufend: CourseStatus.Running,
    bestätigt: CourseStatus.Confirmed,
    geplant: CourseStatus.Planned,
    offen: CourseStatus.Open,
  };
  type CourseSeed = {
    key: string;
    type: string;
    loc: string;
    kw: number;
    off: number;
    lang: Language;
    status: string;
    instr: string | null;
    room: string;
    backup?: string;
    cohort: string | null;
  };
  const courseData: CourseSeed[] = [
    {
      key: 'c1',
      type: 'UK05',
      loc: 'RUP',
      kw: 38,
      off: 0,
      lang: Language.De,
      status: 'laufend',
      instr: 'i1',
      room: 'Halle B',
      cohort: '2025 EFZ',
    },
    {
      key: 'c2',
      type: 'UK01',
      loc: 'BER',
      kw: 38,
      off: 2,
      lang: Language.De,
      status: 'bestätigt',
      instr: 'i7',
      room: 'Raum 2.01',
      backup: 'i11',
      cohort: '2026 EFZ',
    },
    {
      key: 'c3',
      type: 'UK07',
      loc: 'BER',
      kw: 39,
      off: 0,
      lang: Language.De,
      status: 'bestätigt',
      instr: 'i3',
      room: 'Halle 1',
      backup: 'i1',
      cohort: '2025 EFZ',
    },
    {
      key: 'c4',
      type: 'UK03',
      loc: 'RUM',
      kw: 39,
      off: 2,
      lang: Language.De,
      status: 'geplant',
      instr: null,
      room: 'Raum 1.04',
      cohort: '2026 EFZ',
    },
    {
      key: 'c5',
      type: 'UK05',
      loc: 'MAR',
      kw: 40,
      off: 0,
      lang: Language.Fr,
      status: 'bestätigt',
      instr: 'i5',
      room: 'Halle A',
      backup: 'i4',
      cohort: '2025 EFZ',
    },
    {
      key: 'c6',
      type: 'UK07',
      loc: 'RUP',
      kw: 40,
      off: 3,
      lang: Language.De,
      status: 'geplant',
      instr: 'i1',
      room: 'Halle A',
      cohort: '2025 EFZ',
    },
    {
      key: 'c7',
      type: 'EBA2',
      loc: 'GIU',
      kw: 41,
      off: 0,
      lang: Language.It,
      status: 'geplant',
      instr: 'i6',
      room: 'Aula',
      cohort: '2026 EBA',
    },
    {
      key: 'c8',
      type: 'UK09',
      loc: 'BER',
      kw: 41,
      off: 1,
      lang: Language.De,
      status: 'offen',
      instr: null,
      room: 'Raum 3.02',
      cohort: '2025 EFZ',
    },
    {
      key: 'c9',
      type: 'STR1',
      loc: 'ZOF',
      kw: 41,
      off: 5,
      lang: Language.De,
      status: 'bestätigt',
      instr: 'i8',
      room: 'Aussenplatz',
      cohort: null,
    },
    {
      key: 'c10',
      type: 'UK05',
      loc: 'RUM',
      kw: 42,
      off: 0,
      lang: Language.De,
      status: 'offen',
      instr: null,
      room: 'Halle 2',
      cohort: '2025 EFZ',
    },
    {
      key: 'c11',
      type: 'UK01',
      loc: 'MAR',
      kw: 42,
      off: 0,
      lang: Language.Fr,
      status: 'geplant',
      instr: 'i4',
      room: 'Salle 1',
      cohort: '2026 EFZ',
    },
    {
      key: 'c12',
      type: 'WPST',
      loc: 'RUP',
      kw: 43,
      off: 4,
      lang: Language.De,
      status: 'geplant',
      instr: null,
      room: 'Halle B',
      backup: 'i1',
      cohort: null,
    },
    {
      key: 'c13',
      type: 'UK07',
      loc: 'GIU',
      kw: 44,
      off: 0,
      lang: Language.It,
      status: 'offen',
      instr: null,
      room: 'Halle 1',
      cohort: '2025 EFZ',
    },
    {
      key: 'c14',
      type: 'UK03',
      loc: 'BER',
      kw: 44,
      off: 2,
      lang: Language.De,
      status: 'geplant',
      instr: 'i11',
      room: 'Raum 2.03',
      cohort: '2026 EFZ',
    },
    {
      key: 'c15',
      type: 'UK01',
      loc: 'RUP',
      kw: 45,
      off: 0,
      lang: Language.De,
      status: 'geplant',
      instr: 'i10',
      room: 'Raum 1.01',
      cohort: '2026 EFZ',
    },
  ];
  const courses = new Map<string, Course>();
  for (const c of courseData) {
    const t = courseTypeData.find((x) => x.key === c.type)!;
    const course = await insert(Course, {
      courseTypeId: courseTypes.get(c.type)!.id,
      locationId: locations.get(c.loc)!.id,
      language: c.lang,
      cohortId: c.cohort ? cohorts.get(c.cohort)!.id : null,
      capacity: t.max,
      status: statusMap[c.status],
    });
    courses.set(c.key, course);
    const isExam = t.kind === CourseKind.Exam;
    for (let i = 0; i < t.days; i++) {
      const day = addDays(monday(c.kw), t.sat ? 5 + 7 * i : c.off + i);
      await insert(CourseDay, {
        courseId: course.id,
        heldOn: iso(day),
        startsAt: '08:00',
        endsAt: isExam ? '12:00' : '16:30',
        sequence: i + 1,
        roomId: rooms.get(`${c.loc}|${c.room}`)?.id ?? null,
      });
    }
    if (c.instr) {
      await insert(Assignment, {
        courseId: course.id,
        instructorId: instructors.get(c.instr)!.id,
        role: AssignmentRole.Lead,
        status:
          statusMap[c.status] === CourseStatus.Planned
            ? AssignmentStatus.Proposed
            : AssignmentStatus.Confirmed,
      });
    }
    if (c.backup) {
      await insert(Assignment, {
        courseId: course.id,
        instructorId: instructors.get(c.backup)!.id,
        role: AssignmentRole.Backup,
        status: AssignmentStatus.Proposed,
      });
    }
  }

  // --- Schools, classes, apprentices --------------------------------------
  const schoolData = [
    {
      name: 'BBZ Aarau',
      loc: 'RUP',
      canton: 'AG',
      day: 1,
      cohorts: ['2025 EFZ', '2026 EFZ', '2026 EBA'],
    },
    {
      name: 'BBZ Olten',
      loc: 'RUP',
      canton: 'SO',
      day: 4,
      cohorts: ['2025 EFZ', '2026 EFZ', '2026 EBA'],
    },
    {
      name: 'GIBB Bern',
      loc: 'BER',
      canton: 'BE',
      day: 3,
      cohorts: ['2025 EFZ', '2026 EFZ'],
    },
    {
      name: 'BZ Zürich',
      loc: 'RUM',
      canton: 'ZH',
      day: 2,
      cohorts: ['2025 EFZ', '2026 EFZ', '2026 EBA'],
    },
    {
      name: 'EPAC Fribourg',
      loc: 'MAR',
      canton: 'FR',
      day: 5,
      cohorts: ['2025 EFZ', '2026 EFZ'],
    },
    {
      name: 'CPT Bellinzona',
      loc: 'GIU',
      canton: 'TI',
      day: 2,
      cohorts: ['2025 EFZ', '2026 EFZ', '2026 EBA'],
    },
  ];
  const schools = new Map<string, VocationalSchool>();
  const classes = new Map<string, SchoolClass>(); // key: `${school}|${cohort}`
  for (const s of schoolData) {
    const loc = locations.get(s.loc)!;
    const school = await insert(VocationalSchool, {
      name: s.name,
      shortName: s.name,
      canton: s.canton,
      language: loc.languageRegion,
      nearestLocationId: loc.id,
    });
    schools.set(s.name, school);
    for (const label of s.cohorts) {
      const cohort = cohorts.get(label)!;
      const code = `LOG${cohort.track === Track.Eba ? 'BA' : ''}${String(cohort.startYear).slice(2)}a`;
      const cls = await insert(SchoolClass, {
        vocationalSchoolId: school.id,
        code,
        track: cohort.track,
        startYear: cohort.startYear,
      });
      classes.set(`${s.name}|${label}`, cls);
      await insert(SchoolClassDay, {
        schoolClassId: cls.id,
        schoolYearStart: 2026,
        weekday: s.day,
        evening: false,
      });
    }
  }

  const apprenticeData = [
    {
      name: 'Albert Einstein',
      birth: '2008-03-14',
      cohort: '2025 EFZ',
      school: 'BBZ Aarau',
      company: 'Galliker Transport AG',
      lang: Language.De,
      enrolledIn: 'c1',
    },
    {
      name: 'Marie Curie',
      birth: '2008-11-07',
      cohort: '2025 EFZ',
      school: 'GIBB Bern',
      company: 'Planzer Transport AG',
      lang: Language.De,
      enrolledIn: 'c1',
    },
    {
      name: 'Ada Lovelace',
      birth: '2008-12-10',
      cohort: '2025 EFZ',
      school: 'BZ Zürich',
      company: 'Coop Logistik',
      lang: Language.De,
    },
    {
      name: 'Alan Turing',
      birth: '2009-06-23',
      cohort: '2026 EFZ',
      school: 'GIBB Bern',
      company: 'Die Post CH AG',
      lang: Language.De,
      enrolledIn: 'c2',
    },
    {
      name: 'Nikola Tesla',
      birth: '2009-07-10',
      cohort: '2026 EFZ',
      school: 'BBZ Olten',
      company: 'Migros Verteilbetrieb',
      lang: Language.De,
    },
    {
      name: 'Rosa Parks',
      birth: '2009-02-04',
      cohort: '2026 EFZ',
      school: 'EPAC Fribourg',
      company: 'Nestlé Suisse SA',
      lang: Language.Fr,
    },
    {
      name: 'Frida Kahlo',
      birth: '2009-07-06',
      cohort: '2026 EBA',
      school: 'CPT Bellinzona',
      company: 'Camion Transport SA',
      lang: Language.It,
      enrolledIn: 'c7',
    },
    {
      name: 'Nelson Mandela',
      birth: '2008-07-18',
      cohort: '2025 EFZ',
      school: 'BZ Zürich',
      company: 'Digitec Galaxus AG',
      lang: Language.De,
    },
    {
      name: 'Leonardo da Vinci',
      birth: '2009-04-15',
      cohort: '2026 EFZ',
      school: 'BBZ Aarau',
      company: 'Rhenus Logistics',
      lang: Language.De,
    },
    {
      name: 'Greta Thunberg',
      birth: '2009-01-03',
      cohort: '2026 EBA',
      school: 'BBZ Olten',
      company: 'Lidl Schweiz',
      lang: Language.De,
    },
  ];
  const companies = new Map<string, TrainingCompany>();
  for (const a of apprenticeData) {
    if (!companies.has(a.company))
      companies.set(
        a.company,
        await insert(TrainingCompany, { name: a.company }),
      );
    const cohort = cohorts.get(a.cohort)!;
    const [firstName, ...rest] = a.name.split(' ');
    const apprentice = await insert(Apprentice, {
      firstName,
      lastName: rest.join(' '),
      birthDate: a.birth,
      language: a.lang,
      track: cohort.track,
      cohortId: cohort.id,
      vocationalSchoolId: schools.get(a.school)!.id,
      schoolClassId: classes.get(`${a.school}|${a.cohort}`)!.id,
      trainingCompanyId: companies.get(a.company)!.id,
      apprenticeshipStart: `${cohort.startYear}-08-01`,
      apprenticeshipEnd: `${cohort.expectedEndYear}-07-31`,
    });
    if (a.enrolledIn) {
      await insert(Enrollment, {
        courseId: courses.get(a.enrolledIn)!.id,
        apprenticeId: apprentice.id,
        status: EnrollmentStatus.Registered,
        enrolledVia: EnrollmentChannel.Planner,
      });
    }
  }
}

async function main(): Promise<void> {
  const ds = new DataSource(buildDataSourceOptions());
  await ds.initialize();
  await ds.runMigrations();
  await ds.transaction(async (em) => {
    const tables = ds.entityMetadatas.map((m) => `"${m.tableName}"`);
    await em.query(`TRUNCATE TABLE ${tables.join(', ')} CASCADE`);
    await seed(em);
  });
  const counts = await Promise.all(
    ds.entityMetadatas.map(
      async (m) =>
        [m.tableName, await ds.getRepository(m.target).count()] as const,
    ),
  );
  for (const [table, n] of counts.filter(([, n]) => n > 0))
    console.log(`${table}: ${n}`);
  await ds.destroy();
}

await main();
